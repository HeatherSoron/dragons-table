var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var names = require('../www/js/shared/names.js');
var hardener = require('../www/js/shared/validate.js');

var state = {
	objects: [],
	rows:4,
	cols:4
};

var minClientVersion = '0.3.2';


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

function addSocketHandler(socket, command, handler,prototypicalObject) {
	if( prototypicalObject===null ) {
		console.warn("Notice: API command \""+command+"\" accepts arbitrary data. This may or may not be acceptable.");
	}
	socket.on(command, function(msg){
		if (prototypicalObject!==null && !hardener.validateAPIObject(prototypicalObject,msg)) {
			socket.emit('invalid command',{command:command,message:msg});
			return
		}
		var ret = handler(socket,msg);
		if (!ret) { return; }
		var logOb = {
			  type: command,
			  time: new Date()/1,
			  data: ret
		};

		saveChatlog(JSON.stringify(logOb)+"\n");
	});
}

io.on('connection', function(socket) {
	socket.playerData={};
	console.log('WebSockets connection started');
	addSocketHandler(socket,'identify',onIdentify,{version:"",username:""});
	addSocketHandler(socket,'debug test',onDebugTest,null); // accept anything
	addSocketHandler(socket,'disconnect',onDisconnect,null); // not a real message, accept anything
});

var CHATLOG_NAME=null;
function saveChatlog(str){
	fs.appendFileSync(getChatlogName(),str);
}
function getChatlogName(){
	if (CHATLOG_NAME) { return CHATLOG_NAME; }

	// Final format is chatlogs/name yyyy-mm-dd hh_mm_ss.log
	// Using underscores in time because : is reserved on mac
	var d = new Date();

	var year = d.getFullYear();

	var month = d.getMonth() + 1; // Months returned 0-based FNAR.
	if (month < 10) { month='0'+month; }

	var day = d.getDate();
	if (day < 10) { day = '0' + day; }

	var hours = d.getHours();
	if (hours < 10) { hours = '0' + hours; }

	var minutes = d.getMinutes();
	if (minutes < 10) { minutes = '0' + minutes; }

	var seconds = d.getSeconds();
	if (seconds < 10) { seconds = '0' + seconds; }

	try{
		fs.mkdirSync("chatlogs");
	} catch(e) {
		// EEXIST is ok
		if (e.code != 'EEXIST') {
			console.error(e);
		}
	}
	CHATLOG_NAME="chatlogs/chatlog "+year+"-"+month+"-"+day+" "+hours+"_"+minutes+"_"+seconds+".log";
	return CHATLOG_NAME;
}

var SOCKETS={}
// hardcode some names to sockets.
// TODO: Don't map these to null, figure out how to set them to a socket or even multiple sockets!
// Probably do it by making a fake socket that supports emit and everything else we need
SOCKETS["dm"]=null;
SOCKETS["dms"]=null;
SOCKETS["dungeonmaster"]=null;
SOCKETS["dungeon master"]=null;
SOCKETS["gm"]=null;
SOCKETS["gms"]=null;
SOCKETS["gamemasters"]=null;
SOCKETS["game masters"]=null;
SOCKETS["me"]=null;
SOCKETS["self"]=null;
SOCKETS["all"]=null;
SOCKETS["everyone"]=null;
SOCKETS["broadcast"]=null;
SOCKETS["unidentified player"]=null;
// TODO: Figgure out how to blacklist ![anything]


// -----------------------------------------------------------------------------
// Handlers
function onIdentify(socket,msg) {
	if (socket.identified) { return; } // DO NOT allow multiple identifies, that way lies madness.

	if (validVersion(msg.version)) {
		var n=names.createName(msg.username);
		if(!n) {
			socket.emit('invalid player name',{reason:"Name contains invalid characters",name:msg.username});
			return;
		}

		if(SOCKETS[n.canonical]) {
			socket.emit('invalid player name',{reason:"Name in use",name:msg.username});
			return;
		}
		socket.emit('name accepted',msg.username)
		SOCKETS[n.canonical]=socket;
		socket.identified = true; // I think races are less of a problem than mis-identifying!
		console.log("connection identified as: " + JSON.stringify(msg))

		socket.emit('map sync', state);
		socket.playerData.username=n;
		socket.broadcast.emit('players connected',[n]);
		var others=[];
		for(var i in SOCKETS) {
			// TODO: When we make the reserved names non-null, figure out how to skip them.
			// I am thinking that the reserved names will get fake sockets (to support multiple DMs) that we can detect
			if(SOCKETS[i] && SOCKETS[i]!=socket) {
				others.push(SOCKETS[i].playerData.username)
			}
		}
		if(others.length) {
			socket.emit('players connected',others);
		}

		addSocketHandler(socket,'map sync',onMapSync,{rows:0,cols:0,objects:[{color:"",feet:0,name:"",x:0,y:0}]});
		addSocketHandler(socket,'ghost',onGhost,{id:0,position:{x:0,y:0}});
		addSocketHandler(socket,'chat',onChat,{type:"",data:"",time:0});
	} else {
		socket.emit('invalid version',{required:minClientVersion,yours:msg.version});
		console.log('Obsolete connection detected. Data: ' + JSON.stringify(msg));
	}
	return msg;
}
function onDebugTest(socket,msg) {
	socket.emit('debug test echo', msg);
	return false;
}
function onMapSync(socket,msg) {
	console.log("map sync triggered with: " + JSON.stringify(msg));
	state = msg;
	socket.broadcast.emit('map sync', msg);
	return msg;
}
function onGhost(socket,msg) {
	socket.broadcast.emit('ghost', msg);
	return false;
}
function onChat(socket,msg) {
	// TODO: Do SO MUCH MORE here.
	var n="Unidentified Player";
	if(socket.playerData && socket.playerData.username) {
		n=socket.playerData.username.canonical;
	}
	msg.from=n;
	socket.broadcast.emit('chat', msg);
	socket.emit('chat', msg);
	return msg;
}
function onDisconnect(socket,msg) {
	var n="Unidentified Player";
	if(socket.playerData && socket.playerData.username) {
		n=socket.playerData.username.canonical;
		delete SOCKETS[n];
	}

	socket.broadcast.emit('player disconnected',n);
	console.log("WebSocket disconnceted for "+n);
	return {username:n}
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


process.on('SIGINT', function() {
	console.log("\nShutting down...")
	for(var i in SOCKETS) {
		// TODO: When we make the reserved names non-null, figure out how to skip them.
		// I am thinking that the reserved names will get fake sockets (to support multiple DMs) that we can detect
		if(SOCKETS[i]) {
			SOCKETS[i].emit('server disconnected',"Shutdown requested by the CLI (^C).");
			SOCKETS[i].disconnect();
		}
	}
	process.exit();
});
