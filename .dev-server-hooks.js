
var fs = require('fs');
var exec = require('child_process').exec;

exports.hook = function(app) {

  var notify = app.notify;

  app.watch(/\.js$/i, function(ev) {
    var command = ['bash ./jslint'];

    command.push('"' + ev.path + '"');

    child = exec(command.join(' '), function(error, stdout, stderr) {
      var output = stdout.trim().split('\n');
      var niceoutput = [];
      output.slice(0, 5).forEach(function(line) {
        console.error(line);

        line = line.trim();
        if (line === '')
          return;

        var match = line.match(/:(\d+):\(([^)]*)\)\s*(.*)$/);
        if (match) {
          niceoutput.push('\n<b>', match[1], '</b>: ', match[3]);
        }
      });

      if (niceoutput.length > 0)
        return notify(
            '<b>Lint</b>: ' + ev.path + niceoutput.join(''), 'error');
      else
        return notify(
            '<b>Lint OK</b>: ' + ev.path + niceoutput.join(''), 'info');
    });

  });

};
