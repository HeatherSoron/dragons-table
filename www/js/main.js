var DEBUG_MODE = true;

var CLIENT_VERSION = '0.3.1';

function init() {
	log("Application initialized");
	
	app.init();
}

function log(msg) {
	// always pass to console.log
	console.log(msg);
	// assumed to be a <pre> tag.
	var elem = document.getElementById("debug-log");
	elem.innerHTML = msg + "\n" + elem.innerHTML;
}

// taken from StackOverflow, because I don't feel like grabbing jQuery *yet*: http://stackoverflow.com/a/442474
function getElemCoords(el) {
	var _x = 0;
	var _y = 0;
	while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
		_x += el.offsetLeft - el.scrollLeft;
		_y += el.offsetTop - el.scrollTop;
		el = el.offsetParent;
	}
	return { top: _y, left: _x };
}

function getLocalEventPos(evt, elem) {
	var coords = getElemCoords(elem);
	var x = evt.pageX - coords.left;
	var y = evt.pageY - coords.top;
	return {x: x, y: y};
}

function toggleDebugMode() {
	log("Toggling debug. Current state: " + (DEBUG_MODE ? "on" : "off"));
	DEBUG_MODE = !DEBUG_MODE;
	
	var display = DEBUG_MODE ? 'block' : 'none';
	var elems = document.getElementsByClassName('debug');
	for (var i = 0; i < elems.length; ++i) {
		elems[i].style.display = display;
	}
}

var app = {
	init: function() {
		var defaultHost = document.location.href.replace(/^http:../g,"").replace(/\/.*/g,"");
		document.getElementById('hostname').value = defaultHost;
		
		this.canvas = document.getElementById("main-map");
		this.map = new Map(this.canvas);
		this.recalcMap();
		
		this.pointer = undefined;
		this.selectedObject = undefined;
		
		// note: Phonegap seems to send both mousedown and touchstart? Needs experimentation
		this.canvas.addEventListener('mousedown', function(e) { log("mousedown"); app.handlePointerStart(e, app.canvas); } );
		this.canvas.addEventListener('mousemove', function(e) { app.handlePointerMove(e, app.canvas); } );
		this.canvas.addEventListener('mouseup', function(e) { app.handlePointerEnd(e, app.canvas); } );
		this.canvas.addEventListener('touchstart', function(e) { log("touchstart"); app.handlePointerStart(e.changedTouches[0], app.canvas); } );
		this.canvas.addEventListener('touchmove', function(e) { e.preventDefault(); app.handlePointerMove(e.changedTouches[0], app.canvas); } );
		this.canvas.addEventListener('touchend', function(e) { app.handlePointerEnd(e.changedTouches[0], app.canvas); } );
	},
	
	handlePointerStart: function(evt, elem) {
		this.pointer = getLocalEventPos(evt, elem);
		
		log(this.pointer.x);
		log(this.pointer.y);
		
		this.selectMapObject();
	},
	
	handlePointerMove: function(evt, elem) {
		this.pointer = getLocalEventPos(evt, elem);
		if (this.selectedObject) {
			this.moveMapObject();
		}
	},
	
	handlePointerEnd: function(evt, elem) {
		this.pointer = undefined;
		this.releaseMapObject();
	},
	
	selectMapObject: function() {
		this.selectedObject = this.map.getObjectAtPixels(this.pointer);
		if (this.selectedObject) {
			log("Selected object at: " + this.selectedObject.x + "," + this.selectedObject.y);
		} else {
			log("No object selected");
		}
	},
	
	moveMapObject: function() {
		var gridPos = this.map.pxToGrid(this.pointer, true);
		gridPos.x -= 0.5;
		gridPos.y -= 0.5;
		this.selectedObject.ghost = gridPos;
		
		if (this.socket) {
			var index = this.map.objects.indexOf(this.selectedObject);
			this.socket.emit('ghost', {id: index, position: gridPos});
		}
		
		this.map.redraw();
	},
	
	releaseMapObject: function() {
		if (this.selectedObject) {
			this.selectedObject.snapToGhost();
			this.selectedObject = undefined;
			this.map.redraw();
		
			this.sendMapData();
		}
	},
	
	addMapObject: function() {
		var x = parseInt(document.getElementById("x-coord").value);
		var y = parseInt(document.getElementById("y-coord").value);
		
		var size = parseFloat(document.getElementById("obj-size").value);
		
		var r = parseInt(document.getElementById("red").value);
		var g = parseInt(document.getElementById("green").value);
		var b = parseInt(document.getElementById("blue").value);
		
		var color = 'rgb(' + r + ',' + g + ',' + b + ')';
		
		this.map.addObject(new Drawable(x, y, color, size));
		
		this.sendMapData();
		
		this.map.redraw();
	},
	
	recalcMap: function(localOnly) {
		footScale = parseInt(document.getElementById("foot-to-px").value);
		rows = parseInt(document.getElementById("rows").value);
		cols = parseInt(document.getElementById("cols").value);
		
		this.map.recalc(footScale, rows, cols);
		if (!localOnly) {
			this.sendMapData();
		}
	},
	
	syncMapData: function(data) {
		if (data.rows) {
			document.getElementById('rows').value = data.rows;
		}
		if (data.cols) {
			document.getElementById('cols').value = data.cols;
		}
		
		var objList = data.objects;
		for (var i = 0; i < objList.length; ++i) {
			var obj = objList[i];
			objList[i] = new Drawable(obj.x, obj.y, obj.color);
			objList[i].feet = obj.feet;
		}
		
		this.map.objects = objList;
		this.recalcMap(true);
	},
	
	sendMapData: function() {
		if (this.socket) {
			log("Sending map info");
			var data = {
				rows: this.map.rows,
				cols: this.map.cols,
				objects: this.map.objects
			};
			this.socket.emit("map sync", data);
		}
	},
	
	configureSocket: function(url) {
		this.socket = io(url);
		log("WebSockets connect: " + url);
		this.socket.on("map sync", function(msg) {
			app.syncMapData(msg);
		});
		
		this.socket.on('alert', function(msg) {
			alert(msg);
		});
		
		var identification = {
			version: CLIENT_VERSION,
		};
		
		this.socket.emit('identify', identification);
		this.socket.on('re-identify', function(msg) {
			app.socket.emit('identify', identification);
		});
		
		this.socket.on('ghost', function(msg) {
			app.map.objects[msg.id].ghost = msg.position;
			app.map.redraw();
		});
	},
	
	connect: function() {
		var hostUrl = this.getHostUrl();
		// script-loading taken from http://friendlybit.com/js/lazy-loading-asyncronous-javascript/
		var s = document.createElement('script');
		s.type = 'text/javascript';
		s.async = true;
		s.src = hostUrl + 'socket.io/socket.io.js';

		s.addEventListener('load', function() { app.configureSocket(hostUrl); });
		
		var x = document.getElementsByTagName('script')[0];
		x.parentNode.insertBefore(s, x);
	},
	
	download: function() {
		var req = new XMLHttpRequest();
		req.open('GET', this.getHostUrl(), false);
		req.send();
		var raw = req.responseText;
		log("server response: " + raw);
		var data = JSON.parse(raw);
		
		this.syncMapData(data);
	},
	
	upload: function() {
		var req = new XMLHttpRequest();
		req.open('POST', this.getHostUrl());
		req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		req.send(JSON.stringify(this.map.objects));
	},
	
	getHostUrl: function() {
		var hostname = document.getElementById('hostname').value;
		return 'http://' + hostname + '/';
	},
};
