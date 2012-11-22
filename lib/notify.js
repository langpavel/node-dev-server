
var growl = require('growl');



module.exports = function(app) {
  app.notify = function(msg, options, callback) {
    if (!callback) callback = Function.prototype;
    if (typeof options === 'string') options = { image: options };
    if (!options) options = {};
    if (!options.title) options.title = app.title || app.name;
    return growl(msg, options, callback);
  };
};
