
if (!process.env.DEV_SERVER_NO_BETTER_INSPECT)
  require('better-inspect');

var express = require('express');
var http = require('http');
var fs = require('fs');



var app = express();

app.port = process.env.DEV_SERVER_PORT || 4000;
app.root = process.env.DEV_SERVER_ROOT || process.cwd();



express.mime.default_type = 'text/plain';


app.use(express.favicon());
app.use(express.logger(
    ':method :url :status :res[content-length] - :response-time ms'));

// get app name
var name = app.root.match(/([^\/\\]+)$/);
app.title = app.name = name = name ? name[1] : app.root;

// export for hooks
app.express = express;

// inject proxy code
require('./lib/notify')(app);

// inject proxy code
require('./lib/proxy')(app);

// inject watch code
require('./lib/watch')(app);

// hooks go first
require('./lib/hooks')(app);

// bring last request and response to repl
app.use(function(req, res, next) {
  if (app.repl) {
    app.repl.context.lastReq = req;
    app.repl.context.lastRes = res;
  }
  return next();
});

// if index.html is found, static middleware will serve it
app.use(express.static(app.root));
app.use(express.directory(app.root, {
  icons: true,
  sort: 'alphaDirFirst'
}));


app.get('/', function(req, res) {
  res.send('hello world');
});


var server = http.createServer(app);
server.listen(app.port, function() {
  console.log('Server listening at ' + app.port);
  app.notify('listening at <a href="http://127.0.0.1:' +
      app.port + '">http://127.0.0.1:' + app.port + '</a>', 'info');
});


var repl = require('repl').start(name + '@' + app.port + '> ');

app.repl = repl;

repl.context.app = app;
repl.context.express = express;
repl.context.http = http;
repl.context.fs = fs;
repl.context.server = server;
