const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const serveIndex = require('serve-index');
const serveStatic = require('serve-static');
const morgan = require('morgan');

const ROOT = path.resolve(process.env.DEV_SERVER_ROOT || process.cwd());

const app = express();

app.port = process.env.DEV_SERVER_PORT || 4000;
app.root = ROOT;

// app.use(express.favicon());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// get app name
const name = path.basename(ROOT);
app.title = app.name = name;

// export for hooks
app.express = express;

// inject notification code
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
app.use(serveStatic(app.root));
app.use(
  serveIndex(app.root, {
    icons: true,
    directory: name,
    view: 'details',
  })
);

app.get('/', function(req, res) {
  res.send('hello world');
});

const server = http.createServer(app);
server.listen(app.port, function() {
  console.info(`\n[dev-server] listening at http://127.0.0.1:${app.port}`);
  app.notify(`listening at http://127.0.0.1:${app.port}`, 'info');
});

const repl = require('repl').start(name + '@' + app.port + '> ');

app.repl = repl;

repl.context.app = app;
repl.context.express = express;
repl.context.http = http;
repl.context.fs = fs;
repl.context.server = server;
