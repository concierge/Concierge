var require_install	= require('require-install'),
    gitpull		    = require_install('git-pull');

exports.match = function(text) {
  return text === this.commandPrefix + 'update';
};

exports.run = function(api, event) {
  var fp = path.resolve(__dirname, '../');
  gitpull(fp, function (err, consoleOutput) {
    if (err) {
      api.sendMessage('Update failed. Manual intervention is probably required.', event.thread_id);
    } else {
      api.sendMessage('Update successful. Restart to load changes.', event.thread_id);
    }
  });
  return false;
};
