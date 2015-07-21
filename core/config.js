var fs = require('fs'),
  config = NULL;

exports.getConfig = function(m) {
  return config[m];
};

exports.loadConfig = function(location, callback) {
  fs.readFile(location, 'utf8', function (err, data) {
    if (err) {
      config = {};
      callback({"error":true, "data":err});
      return;
    }
    config = JSON.parse(data);
    callback({"error":false});
  });
};

exports.saveConfig = function(location, callback) {
  fs.writeFile(location, JSON.stringify(config), 'utf8', function(err) {
    if (err) {
      callback({"error":true, "data":err});
      return;
    }
    callback({"error":false});
  });
};
