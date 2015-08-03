/**
 * Main platform. Handles the core interop of the program and
 * acts as the glue code for the various parts of the code.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */


// Setup file scope variables
var config        = require('./config.js'),
    path          = require('path'),
    fs            = require('fs'),
    configFile    = 'config.json',
    started       = false,
    loadedModules = [],
    coreModules   = [],
    mode          = null;

// Load core files
require('./prototypes.js');
require('./require.js').loadRequire.apply(exports, [require]);

// Setup platform scope variables
exports.require_install = require('require-install');
exports.commandPrefix = '/';
exports.packageInfo = require('../package.json');
exports.packageInfo.name.toProperCase();

exports.filesInDirectory = function(directory, callback) {
  fs.readdir(directory, function(err, files) {
    callback(err ? [] : files);
 });
};

exports.listModules = function(directory, callback) {
  exports.filesInDirectory('./modules', function(data) {
    data = data.filter(function(value) {
      return value.endsWith(".js");
    });
    callback(data);
  });
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
  var matchArgs = [event.body, event.thread_id, event.sender_name],
      runArgs   = [api, event],
      abort     = false;

  // Run core modules in platform mode
  for (var i = 0; i < coreModules.length; i++) {
		if (coreModules[i].apply(exports, matchArgs)) {
      abort = abort || !loadedModules[i].apply(this, runArgs);
		}
	}
  if (abort) {
    return;
  }

  // Run user modules in protected mode
  for (var i = 0; i < loadedModules.length; i++) {
    if (loadedModules[i].apply(loadedModules[i], matchArgs)) {
      try {
        loadedModules[i].apply(loadedModules[i], runArgs);
      } catch (e) {
        api.sendMessage(event.body + ' fucked up. Damn you ' + event.sender_name + ".", event.thread_id);
        console.trace(e);
      }
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
      mode.platform = exports;
      mode.config = config.getConfig("output");
      if (mode.config.commandPrefix) {
        exports.commandPrefix = mode.config.commandPrefix;
      }
      else {
        mode.config.commandPrefix = exports.commandPrefix;
      }
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
        m.platform = exports;
        m.config = config.getConfig(modules[i]);
        if (m.load) {
          m.load();
        }
        loadedModules.push(m);
      }
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

  // Unload user modules
  for (var i = 0; i < loadedModules.length; i++) {
    if (loadedModules[i].unload) {
      loadedModules[i].unload();
    }
    loadedModules[i] = null;
  }
  loadedModules = [];

  // Unload core modules
  for (var i = 0; i < coreModules.length; i++) {
    if (loadedModules[i].unload) {
      coreModules[i].unload();
    }
    coreModules[i] = null;
  }
  coreModules = [];

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
