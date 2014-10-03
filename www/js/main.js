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
		this.map.addObject(new Drawable(2, 1));
		this.recalcMap();
		
		this.pointer = undefined;
		this.selectedObject = undefined;
		
		// note: Phonegap seems to send both mousedown and touchstart? Needs experimentation
		this.canvas.addEventListener('mousedown', function(e) { log("mousedown"); app.handlePointerStart(e, app.canvas); } );
		this.canvas.addEventListener('mousemove', function(e) { app.handlePointerMove(e, app.canvas); } );
		this.canvas.addEventListener('mouseup', function(e) { app.handlePointerEnd(e, app.canvas); } );
		this.canvas.addEventListener('touchstart', function(e) { log("touchstart"); app.handlePointerStart(e.changedTouches[0], app.canvas); } );
		this.canvas.addEventListener('touchmove', function(e) { e.preventDefault(); app.handlePointerMove(e.changedTouches[0], app.canvas); } );
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
	
	handlePointerUp: function(evt, elem) {
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
		var gridPos = this.map.pxToGrid(this.pointer);
		this.selectedObject.x = gridPos.x;
		this.selectedObject.y = gridPos.y;
		this.map.redraw();
	},
	
	releaseMapObject: function() {
		this.selectedObject = null;
	},
	
	recalcMap: function() {
		footScale = parseInt(document.getElementById("foot-to-px").value);
		rows = parseInt(document.getElementById("rows").value);
		cols = parseInt(document.getElementById("cols").value);
		
		this.map.recalc(footScale, rows, cols);
	},
};
