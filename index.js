
require('better-inspect');

var express = require('express');
var http = require('http');
var fs = require('fs');



var PORT = process.env.DEV_SERVER_PORT || 4000;
var SERVER_ROOT = process.env.DEV_SERVER_ROOT || process.cwd();


var app = express();


express.mime.default_type = 'text/plain';


app.use(express.favicon());
app.use(express.logger(':method :url :status :res[content-length] - :response-time ms'));

// if index.html is found, static middleware will serve it
app.use(express.static(SERVER_ROOT));
app.use(express.directory(SERVER_ROOT, {
  icons: true,
  sort: 'alphaDirFirst',
}));


app.get('/', function(req, res) {
  res.send('hello world');
})


var server = http.createServer(app);
server.listen(PORT, function() {
  console.log("Server listening at " + PORT);
});


var name = SERVER_ROOT.match(/([^\/\\]+)$/);
name = name ? name[1] : SERVER_ROOT;

var repl = require('repl').start(name + '@' + PORT + '> ');

repl.context.app = app;
repl.context.express = express;
repl.context.http = http;
repl.context.fs = fs;
repl.context.server = server;
