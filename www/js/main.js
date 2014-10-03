var DEBUG_MODE = true;

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
		
			if (this.socket) {
				log("Sending map info");
				this.socket.emit("map sync", this.map.objects);
			}
		}
	},
	
	addMapObject: function() {
		var x = parseInt(document.getElementById("x-coord").value);
		var y = parseInt(document.getElementById("y-coord").value);
		
		this.map.addObject(new Drawable(x, y));
		this.map.redraw();
	},
	
	recalcMap: function() {
		footScale = parseInt(document.getElementById("foot-to-px").value);
		rows = parseInt(document.getElementById("rows").value);
		cols = parseInt(document.getElementById("cols").value);
		
		this.map.recalc(footScale, rows, cols);
	},
	
	syncMapData: function(data) {
		for (var key in data) {
			data[key] = new Drawable(data[key].x, data[key].y);
		}
		
		this.map.objects = data;
		this.map.redraw();
	},
	
	configureSocket: function(url) {
		this.socket = io(url);
		log("WebSockets connect: " + url);
		this.socket.on("map sync", function(msg) {
			app.syncMapData(msg);
		});
		
		this.socket.on('alert', alert);
		
		var identification = {
			version: '0.1.1',
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
