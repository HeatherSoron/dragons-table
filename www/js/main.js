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
	},
	
	recalcMap: function() {
		footScale = parseInt(document.getElementById("foot-to-px").value);
		rows = parseInt(document.getElementById("rows").value);
		cols = parseInt(document.getElementById("cols").value);
		
		this.map.recalc(footScale, rows, cols);
	},
};
