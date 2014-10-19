var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var state = {
	objects: [],
};

var minClientVersion = '0.3.0';

app.use(bodyParser.json());
app.use(cors());

var parentDir = __dirname.substring(0, __dirname.lastIndexOf('/'));
app.use('/play', express.static(parentDir + '/www'));

app.get('/', function(req, res) {
	res.send(JSON.stringify(state));
});

app.post('/', function(req, res) {
	console.log(req.body);
	state = req.body;
});

function addSocketHandler(socket,command,handler) {
	socket.on(command,function(msg){
		handler(socket,msg); // TODO: Handle chat log here
	});
}

io.on('connection', function(socket) {
	console.log('WebSockets connection started');
	addSocketHandler(socket,'identify',onIdentify);
	addSocketHandler(socket,'debug test',onDebugTest);
	if (!socket.identified) {
		socket.emit('re-identify');
	}
});


// -----------------------------------------------------------------------------
// Handlers
function onIdentify(socket,msg) {
	console.log("connection identified as: " + JSON.stringify(msg));
	socket.identified = true;

	if (validVersion(msg.version)) {
		socket.emit('map sync', state);

		addSocketHandler(socket,'map sync',onMapSync);
		addSocketHandler(socket,'ghost',onGhost);
	} else {
		socket.emit('alert', "Update your client.\n\nYour version: " + msg.version + '\nMinimum version: ' + minClientVersion);
		console.log('Obsolete connection detected. Data: ' + JSON.stringify(msg));
	}
}
function onDebugTest(socket,msg) {
	socket.emit('debug test echo', msg);
}
function onMapSync(socket,msg) {
	console.log("map sync triggered with: " + JSON.stringify(msg));
	state = msg;
	socket.broadcast.emit('map sync', msg);
}
function onGhost(socket,msg) {
	socket.broadcast.emit('ghost', msg);
}
// End Handlers
// -----------------------------------------------------------------------------

http.listen(3000, function(){
	console.log('listening on *:3000');
});

function validVersion(version) {
	var min = minClientVersion.split(/\.-/);
	var actual = version.split(/\.-/);
	
	for (var i = 0; i < min.length; ++i) {
		if (actual[i] > min[i]) {
			return true;
		} else if (actual[i] < min[i]) {
			return false;
		}
	}
	return true;
}
