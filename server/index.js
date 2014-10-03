var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var state = {};

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

io.on('connection', function(socket) {
	console.log('WebSockets connection started');
	socket.on('map sync', function(msg) {
		console.log("map sync triggered with: " + JSON.stringify(msg));
		socket.broadcast.emit('map sync', msg);
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
