var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

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
		var ret=handler(socket,msg);
		if(!ret)return;
		var logOb={
			  type:command,
			  time:new Date()/1,
			  data:ret
		};

		saveChatlog(JSON.stringify(logOb)+"\n");
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

var CHATLOG_NAME=null;
function saveChatlog(str)
{
	fs.appendFileSync(getChatlogName(),str);
}
function getChatlogName()
{
	if(CHATLOG_NAME)return CHATLOG_NAME;

	// Final format is Chatlogs/name yyyy-mm-dd hh_mm_ss.log
	// Using underscores in time because : is reserved on mac
	var d=new Date();

	var year=d.getFullYear();

	var month=d.getMonth()+1;
	if(month<10)month='0'+month;

	var day=d.getDate()+1;
	if(day<10)day='0'+day;

	var hours=d.getHours();
	if(hours<10)hours='0'+hours;

	var minutes=d.getMinutes();
	if(minutes<10)minutes='0'+minutes;

	var seconds=d.getSeconds();
	if(seconds<10)seconds='0'+seconds;

	try{
		fs.mkdirSync("Chatlogs");
	}catch(e)
	{
		if(e.code!='EEXIST') // EEXIST is ok
		{
			console.error(e);
		}
	}
	CHATLOG_NAME="Chatlogs/Chatlog "+year+"-"+month+"-"+day+" "+hours+"_"+minutes+"_"+seconds+".log";
	return CHATLOG_NAME;
}


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
	return msg;
}
function onDebugTest(socket,msg) {
	socket.emit('debug test echo', msg);
}
function onMapSync(socket,msg) {
	console.log("map sync triggered with: " + JSON.stringify(msg));
	state = msg;
	socket.broadcast.emit('map sync', msg);
	return msg;
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
