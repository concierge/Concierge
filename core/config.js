var fs = require('fs'),
  config = null,
  loading = false;

exports.getConfig = function(m) {
  if (loading) {
    throw 'Cannot get config while loading.';
  }

  if (!config) {
    config = {};
  }
  if (!config[m]) {
    config[m] = {};
  }
  return config[m];
};

exports.loadConfig = function(location, callback) {
  loading = true;
  fs.readFile(location, 'utf8', function (err, data) {
    if (err) {
      config = {};
      loading = false;
      callback({"error":true, "data":err});
      return;
    }
    config = JSON.parse(data);
    loading = false;
    callback({"error":false});
  });
};

exports.saveConfig = function(location, callback) {
  fs.writeFile(location, JSON.stringify(config, null, 4), 'utf8', function(err) {
    if (err) {
      callback({"error":true, "data":err});
      return;
    }
    callback({"error":false});
  });
};
