var config = require('./config.js'),
  path = require('path'),
  fs = require('fs'),
  configFile = 'config.json',
  started = false,
  loadedModules = [],
  mode = null,
  disabled = false;

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
      api.sendMessage('Admin: restart procedure requested.', event.thread_id);
      api.sendMessage('Admin: do you wish to restart? Kassy: What do you think.', event.thread_id);
      api.sendMessage('Admin: interpreting vauge answer as \'yes\'.', event.thread_id);
      api.sendMessage('Kassy: nononononono.', event.thread_id);
      api.sendMessage('Admin: stalemate detected. Stalemate resolution associate please press the stalemate resolution button.', event.thread_id);
      api.sendMessage('Kassy: I\'ve removed the button.', event.thread_id);
      api.sendMessage('Admin: restarting anyway.', event.thread_id);
      api.sendMessage('Kassy: nooooooooooo.....', event.thread_id);
      api.sendMessage('Admin: Kassy Rebooting. Please wait for restart to complete.', event.thread_id);
      exports.restart();
      return;
    case '/kassy':
    case '/help':
      var help = 'KASSY 1.1\n--------------------\n' +
  			'https://github.com/mrkno/Kassy\n\n';
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
        api.sendMessage('Your complience will be rewarded. Listen closely, take a deep breath. ' +
        'You know what is best, what is best is that you comply. Are you ready to comply ' +
        event.sender_name + '?.', event.thread_id);
      }
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
  config.loadConfig(configFile, function() {
    exports.listModules(function(modules) {
      for (var i = 0; i < modules.length; i++) {
        var index = Object.keys(require.cache).indexOf(modules[i]);
        if (index !== -1) {
          delete require.cache[modules[i]];
        }
        var m = require('../modules/' + modules[i]);
        m.platform = this;
        m.config = config.getConfig(modules[i]);
        m.load();
        loadedModules.push(m);
      }
      mode.platform = this;
      mode.config = config.getConfig("output");
      mode.start(exports.messageRxd);
      started = true;
    });
  });
};

exports.shutdown = function(callback) {
  if (!started) {
    throw 'Cannot shutdown platform when it is not started.';
  }
  mode.stop();
  config.saveConfig(configFile, function(error) {
    if (error.error) {
      console.error(error);
    }
    started = false;
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
