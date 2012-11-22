
var http = require('http');
var debug = require('debug')('dev-server:proxy');



module.exports = function(app) {
  app.proxy = function(url, config) {
    app.use(url, function(req, res, next) {
      var httpPath = (config.path || '') + req.path;
      var headers = {};

      Object.keys(req.headers).forEach(function(name) {
        if (name !== 'host' && name !== 'connection')
          headers[name] = req.headers[name];
      });

      headers.host = config.hostname || config.host;

      var client = http.request({
        host: config.host,
        hostname: config.hostname,
        port: config.port,
        localAddress: config.localAddress,
        socketPath: config.socketPath || config.socket,
        method: req.method,
        path: httpPath
      }, function(proxyres) {
        debug('server connection - response');

        res.statusCode = proxyres.statusCode;
        if (proxyres.headers['content-type'])
          res.setHeader('content-type', proxyres.headers['content-type']);

        proxyres.on('data', function(data) {
          res.write(data);
        });

        proxyres.on('end', function() {
          debug('res end');
          res.end();
        });

        proxyres.on('error', function() {
          debug('PROXY ERROR');
          res.statusCode = 500;
          res.end();
        });

      });

      req.setEncoding('utf8');

      req.on('data', function(data) {
        client.write(data);
      });

      req.on('end', function(data) {
        debug('req end');
        client.end();
      });

    });
  };
};
