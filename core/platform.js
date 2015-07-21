var config = require('./config.js'),
  configFile = 'config.json',
  started = false,
  loadedModules = [],
  mode = NULL;

exports.listModules();
exports.listModes();

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
  mode.run(loadedModules);
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
