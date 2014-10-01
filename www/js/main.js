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
		this.ctx = this.canvas.getContext("2d");
		
		this.feetPerGrid = 5;
		
		this.recalcMap();
	},
	
	recalcMap: function() {
		this.footScale = parseInt(document.getElementById("foot-to-px").value);
		this.rows = parseInt(document.getElementById("rows").value);
		this.cols = parseInt(document.getElementById("cols").value);
		
		this.gridSize = this.feetPerGrid * this.footScale;
		
		this.width = this.cols * this.gridSize;
		this.height = this.rows * this.gridSize;
		
		this.canvas.width = this.width;
		this.canvas.height = this.height;
	}
};
