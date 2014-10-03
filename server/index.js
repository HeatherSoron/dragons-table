var app = require('express')();
var bodyParser = require('body-parser');
var cors = require('cors');
var http = require('http').Server(app);

var state = {};

app.use(bodyParser.json());
app.use(cors());

app.get('/', function(req, res) {
	res.send(JSON.stringify(state));
});

app.post('/', function(req, res) {
	console.log(req.body);
	state = req.body;
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
