var DEBUG_MODE = true;

function init() {
	log("Application initialized");
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
