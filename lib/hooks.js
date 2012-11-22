
var path = require('path');



module.exports = function(app) {
  var names = ['dev-server-hooks', '.dev-server-hooks'];
  for (var i = 0, l = names.length; i < l; i++) {
    try {
      var moduleName = require.resolve(path.join(app.root, names[i]));
      console.log('Loading ' + moduleName + '...');
      app.hooks = require(moduleName);
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND')
        continue;
      console.error('Error when loading ' + moduleName);
      console.error(err);
      app.notify('Error when loading custom hook', { image: 'error' });
    }
  }

  try {
    if (app.hooks && app.hooks.hook)
      app.hooks.hook(app);
  } catch (err) {
    console.error('Error when executing hook ' + moduleName);
    console.error(err);
    app.notify('Error when executing custom hook', { image: 'error' });
  }
};
