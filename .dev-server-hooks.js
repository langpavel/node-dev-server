const path = require('path');
const exec = require('child_process').exec;
const { unstyle } = require('ansi-colors');

function asciiLink(text, url, attrs) {
  return `\x1b]8;${attrs || ''};${url || text}\x07${text}\x1b]8;;\x07`;
}

function prefixLines(prefix, lines) {
  return (lines || '')
    .split('\n')
    .map(line => prefix + line)
    .join('\n');
}

exports.hook = function(app) {
  const eslintExecOptions = {
    cwd: app.root,
    timeout: 10000,
    windowsHide: true,
  };

  app.watch(/\.js$/i, function(ev) {
    const fileName = ev.path;
    const fullPath = path.resolve(fileName);
    const commandParts = ['eslint --no-ignore --color'];
    commandParts.push('"' + fileName.replace(/"/g, '\\"') + '"');
    const command = commandParts.join(' ');

    // console.error(`[lint$] ${command}`);
    exec(command, eslintExecOptions, function(error, stdout, stderr) {
      const errCode = (error && error.code) || 0;
      const trimmedOut = (stdout || '').trim();
      const trimmedErr = (stderr || '').trim();
      if (trimmedErr) {
        console.error(prefixLines('[lint ERR] ', trimmedErr));
      }
      if (trimmedOut) {
        console.info(prefixLines('[lint] ', trimmedOut));
      }
      console.info(
        prefixLines(
          `[lint ${errCode === 0 ? 'OK' : 'FAIL'}] ${asciiLink(fileName, `file:${fullPath}`)}`,
        ),
      );

      const textOut = unstyle(trimmedOut);
      const textErr = unstyle(trimmedErr);
      app.notify(
        `<b>${errCode ? 'Lint err' : 'Lint OK'}</b>: ${fileName}\n${textOut}\n${textErr}`,
        errCode ? 'error' : 'info',
      );
    });
  });
};
