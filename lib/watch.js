
var debug = require('debug')('dev-server:watch');
var fs = require('fs');
var path = require('path');

var notify = Function.prototype;



Watcher.ignoreNames = ['.git', '.svn', '_svn', '_git'];
Watcher.DEFER_TIMEOUT = 100; // ms



function Watcher(root) {
  this.root = root;
  this._pendingDiscovery = 0;
  this._watch(root);
  this._seenStat = {};
  this._targets = [];
  debug('Watcher started in ' + root);
}


Watcher.prototype._error = function(err) {
  console.error('Watcher error: ', err);
};



Watcher.prototype._decPending = function() {
  this._pendingDiscovery--;
  if (this._pendingDiscovery === 0) {
    debug('All discovered');
    notify('Watching for changes', 'info');
  }
};



Watcher.prototype._watch = function(name) {
  var self = this;
  self._pendingDiscovery++;
  // lstat accepts symlinks not targets, this prevents deadly recursion
  fs.lstat(name, function(err, stat) {
    if (err) {
      self._decPending();
      return self._error(err);
    }
    var relative = path.relative(self.root, name);
    self._seenStat[relative] = stat || null;
    if (stat.isDirectory()) {
      self._watchDir(name);
    } else {
      self._decPending();
    }
  });
};



Watcher.prototype._watchDir = function(root) {
  var self = this;

  fs.watch(root, function(ev, filename) {
    debug('fs.watch', arguments);
    self._change(root, filename, ev);
  });

  fs.readdir(root, function(err, files) {
    if (err) {
      self._decPending();
      return self._error(err);
    }

    files.forEach(function(name) {
      if (Watcher.ignoreNames.indexOf(name) !== -1)
        return;

      var fullname = path.join(root, name);
      self._watch(fullname);
    });
    self._decPending();
  });
};


Watcher._clearDeferTimeout = function() {
  Watcher._defered = {
    timeout: null,
    all: []
  };
};
Watcher._clearDeferTimeout();



Watcher.prototype._defer = function(method, relative, stat, oldStat) {
  var data = Watcher._defered;
  if (data.timeout) clearTimeout(data.timeout);
  data.all.push({
    method: method,
    path: relative,
    stat: stat,
    oldStat: oldStat
  });
  data.timeout = setTimeout(
      this._deferTimeout.bind(this), Watcher.DEFER_TIMEOUT);
};



Watcher.prototype._deferTimeout = function() {
  var data = Watcher._defered;
  var self = this;
  var byInode = {};

  data.all.forEach(function(item) {
    if (item.stat && item.stat.ino) {
      var key = item.stat.dev + ':' + item.stat.ino;
      if (byInode[key]) {
        var item2 = byInode[key];

        if (item.method === item2.method) return;

        if (item2.method === 'deleted') {
          var tmp = item; item = item2; item2 = tmp;
        }

        if (item.method === 'deleted' && item2.method === 'created') {
          item2.method = 'moved';
          item2.from = item.path;
          byInode[key] = item2;
        } else {
          debug('Multiple events?', [item, item2]);
        }
      } else {
        byInode[key] = item;
      }
    } else {
      debug('Item has no stat or inode info', item);
    }
  });

  Object.getOwnPropertyNames(byInode).forEach(function(key) {
    var ev = byInode[key];
    self._targets.forEach(function(target) {
      if (target.target instanceof RegExp) {
        if (target.target.test(ev.path)) {
          debug('Invoking custom hook for ' + ev.path);
          target.callback(ev);
        }
      }
    });
  });

  Watcher._clearDeferTimeout();
};



Watcher.prototype._updateStat = function(absolute, relative, err, stat) {
  var oldStat = this._seenStat[relative];
  var newStat = this._seenStat[relative] = stat || null;
  if (newStat && !oldStat) {
    this._defer('created', relative, newStat);

    if (newStat.isDirectory())
      this._watchDir(absolute);

  } else if (!newStat && oldStat) {
    this._defer('deleted', relative, oldStat);
  } else if (!newStat && !oldStat) {
    // stated after delete or move...
    if (err) {
      if (err.code === 'ENOENT') {
        this._defer('deleted', relative);
      } else {
        notify('Error stating ' + relative + ': ' + err.toString());
      }
    } else {
      notify('No old, no new and no error, WTF?? ' + relative);
    }
  } else {
    if ((newStat.mtime.getTime() !== oldStat.mtime.getTime()) ||
        (newStat.size !== oldStat.size))
    {
      this._defer('updated', relative, newStat, oldStat);
    }
  }
};



Watcher.prototype._change = function(root, filename, ev) {
  var absolute = path.join(root, filename);
  var relative = path.relative(this.root, absolute);
  var self = this;
  fs.lstat(absolute, function(err, stat) {
    self._updateStat(absolute, relative, err, stat);
  });
};



Watcher.prototype.add = function(target, callback) {
  this._targets.push({target: target, callback: callback});
};



module.exports = function(app) {
  app.watch = function(target, callback) {
    if (!app._watcher)
      app._watcher = new Watcher(app.root);
    return app._watcher.add.apply(app._watcher, arguments);
  };
  notify = function() {
    debug(arguments);
    return app.notify.apply(null, arguments);
  }
};
