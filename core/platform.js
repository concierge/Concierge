var config = require('./config.js'),
  configFile = 'config.json',
  started = false,
  loadedModules = [],
  mode = NULL,
  disabled = false;

exports.listModules();
exports.listModes();

exports.messageRxd = function(api, event) {
  switch (event.body) {
    case '/shutdown':
      var shutdownResponses = ['Good Night', 'I don\'t blame you.', 'There you are.', 'Please.... No, Noooo!'];
			var index = Math.floor(Math.random() * shutdownResponses.length);
			api.sendMessage(shutdownResponses[index], event.thread_id);
      exports.shutdown();
      return;
    case '/restart':
      api.sendMessage('New version avalible.', event.thread_id);
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
        api.sendMessage('Your complience will be rewarded. Listen closely, take a deep breath. You know what is best, what is best is that you comply. Are you ready to comply?.', event.thread_id);
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
  mode = newMode;
}

exports.start = function() {
  if (started) {
    throw 'Cannot start platform when it is already started.';
  }
  if (!mode) {
    throw 'Mode must be set before starting';
  }
  config.loadConfig(configFile);

  var modules = listModules();
  for (var i = 0; i < modules.length; i++) {
    var index = Object.keys(require.cache).indexOf(modules[i]);
    if (index !== -1) {
      delete require.cache[modules[i]];
    }
    var m = require(modules[i]);
    m.platform = this;
    m.config = config.getConfig(modules[m]);
    m.load();
    loadedModules.push(m);
  }
  mode.platform = this;
  mode.config = config.getConfig("output");
  mode.start(exports.messageRxd);
  started = true;
};

exports.shutdown = function() {
  if (!started) {
    throw 'Cannot shutdown platform when it is not started.';
  }
  mode.stop();
  config.saveConfig(configFile);
  started = false;
};

exports.restart = function() {
  exports.shutdown();
  exports.start();
};
