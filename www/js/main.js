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
		
		// note: Phonegap seems to send both mousedown and touchstart? Needs experimentation
		this.canvas.addEventListener('mousedown', function(e) { log("mousedown"); app.handlePointerStart(e, app.canvas); } );
		this.canvas.addEventListener('touchstart', function(e) { log("touchstart"); app.handlePointerStart(e.changedTouches[0], app.canvas); } );
	},
	
	handlePointerStart: function(evt, elem) {
		var coords = getElemCoords(elem);
		log(evt.pageX - coords.left);
		log(evt.pageY - coords.top);
	},
	
	recalcMap: function() {
		footScale = parseInt(document.getElementById("foot-to-px").value);
		rows = parseInt(document.getElementById("rows").value);
		cols = parseInt(document.getElementById("cols").value);
		
		this.map.recalc(footScale, rows, cols);
	},
};
