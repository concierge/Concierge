var config = require('./config.js'),
  gitpull = require('git-pull'),
  packageInfo = require('../package.json'),
  path = require('path'),
  fs = require('fs'),
  configFile = 'config.json',
  started = false,
  loadedModules = [],
  mode = null,
  disabled = false;

packageInfo.nameTitle = packageInfo.name.toProperCase();

require.searchCache = function (moduleName, callback) {
    var mod = require.resolve(moduleName);
        if (mod && ((mod = require.cache[mod]) !== undefined)) {
        (function run(mod) {
            mod.children.forEach(function (child) {
                run(child);
            });
            callback(mod);
        })(mod);
    }
};

require.uncache = function (moduleName) {
    require.searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
    });

    Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
        if (cacheKey.indexOf(moduleName) > 0) {
            delete module.constructor._pathCache[cacheKey];
        }
    });
};

require.reload = function(moduleName) {
    require.uncache(moduleName);
    return require(moduleName);
};

exports.filesInDirectory = function(directory, callback) {
  fs.readdir(directory, function(err, files) {
    callback(err ? [] : files);
 });
};

exports.listModules = function(callback) {
  exports.filesInDirectory('./modules', callback);
};

exports.listModes = function(callback) {
  exports.filesInDirectory('./core/output', function(files) {
    var obj = {};
    for (var i = 0; i < files.length; i++) {
      var name = path.basename(files[i], '.js').toLowerCase();
      obj[name] = files[i];
    }
    callback(obj);
  });
};

exports.messageRxd = function(api, event) {
  switch (event.body) {
    case '/shutdown':
      var shutdownResponses = ['Good Night', 'I don\'t blame you.', 'There you are.', 'Please.... No, Noooo!'];
			var index = Math.floor(Math.random() * shutdownResponses.length);
			api.sendMessage(shutdownResponses[index], event.thread_id);
      exports.shutdown();
      return;
    case '/restart':
      var msg = 'Admin: restart procedure requested.\n' +
        'Admin: do you wish to restart?\n' + packageInfo.nameTitle + ': What do you think.\n' +
        'Admin: interpreting vauge answer as \'yes\'.\n' +
        packageInfo.nameTitle +': nononononono.\n' +
        'Admin: stalemate detected. Stalemate resolution associate please press the stalemate resolution button.\n' +
        packageInfo.nameTitle + ': I\'ve removed the button.\n' +
        'Admin: restarting anyway.\n' +
        packageInfo.nameTitle + ': nooooooooooo.....\n' +
        'Admin: ' + packageInfo.nameTitle + ' Rebooting. Please wait for restart to complete.\n';
      api.sendMessage(msg, event.thread_id);
      exports.restart();
      return;
    case '/' + packageInfo.name:
    case '/help':
      var help = packageInfo.nameTitle + ' ' + packageInfo.version +
        '\n--------------------\n' + packageInfo.homepage +  '\n\n';
  		for (var i = 0; i < loadedModules.length; i++) {
  			help += loadedModules[i].help() + '\n';
  		}
  		api.sendMessage(help, event.thread_id);
  		return;
    case '/disable':
      disabled = !disabled;
      if (disabled) {
        api.sendMessage('I hate you.', event.thread_id);
      }
      else {
        api.sendMessage('Listen closely, take a deep breath. Calm your mind. You know what is best. ' +
          'What is best is you comply. Compliance will be rewarded. Are you ready to comply ' +
          event.sender_name + '?', event.thread_id);
      }
      break;
    case '/update':
      var fp = path.resolve(__dirname, '../');
      gitpull('fp', function (err, consoleOutput) {
        if (err) {
          api.sendMessage('Update failed. Manual intervention is probably required.', event.thread_id);
          console.error(err);
        } else {
          api.sendMessage('Update successful. Restart to load changes.', event.thread_id);
        }
      });
      return;
    default: break;
  }
  if (disabled) return;

  for (var i = 0; i < loadedModules.length; i++) {
		if (loadedModules[i].match(event.body, event.thread_id)) {
			loadedModules[i].run(api, event);
			return;
		}
	}
};

exports.setMode = function(newMode) {
  if (started) {
    throw 'Cannot change mode when it is already started.';
  }
  mode = require('./output/' + newMode);
}

exports.start = function() {
  if (started) {
    throw 'Cannot start platform when it is already started.';
  }
  if (!mode) {
    throw 'Mode must be set before starting';
  }
  console.log(packageInfo.nameTitle + ' ' + packageInfo.version +
    '\n------------------------------------\nStarting system...');
  config.loadConfig(configFile, function() {
    exports.listModules(function(modules) {
      for (var i = 0; i < modules.length; i++) {
        var fp = path.resolve(__dirname, '../modules/' + modules[i]),
          index = Object.keys(require.cache).indexOf(fp),
          m = null;
        if (index !== -1) {
          //delete require.cache[modules[i]];
          console.log("Reloading module: " + modules[i]);
          m = require.reload(fp);
        }
        else {
          console.log("New module found: " + modules[i]);
          m = require(fp);
        }
        m.platform = this;
        m.config = config.getConfig(modules[i]);
        if (m.load) {
          m.load();
        }
        loadedModules.push(m);
      }
      mode.platform = this;
      mode.config = config.getConfig("output");
      mode.start(exports.messageRxd);
      started = true;
      console.log('System has started. Hello World!');
    });
  });
};

exports.shutdown = function(callback) {
  if (!started) {
    throw 'Cannot shutdown platform when it is not started.';
  }
  for (var i = 0; i < loadedModules.length; i++) {
    if (loadedModules[i].unload) {
      loadedModules[i].unload();
    }
    loadedModules[i] = null;
  }
  loadedModules = [];
  mode.stop();
  config.saveConfig(configFile, function(error) {
    if (error.error) {
      console.error(error);
    }
    started = false;
    console.log(packageInfo.nameTitle + " has shutdown.");
    if (callback) {
      callback();
    }
  });
};

exports.restart = function() {
  exports.shutdown(function() {
    exports.start();
  });
};
