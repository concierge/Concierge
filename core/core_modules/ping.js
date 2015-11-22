var os = require("os");

exports.match = function(text) {
  return text === this.commandPrefix + 'ping';
};

exports.run = function(api, event) {
  api.sendMessage(this.packageInfo.name + ' ' + this.packageInfo.version + ' @ ' + os.hostname(), event.thread_id);
  return false;
};
