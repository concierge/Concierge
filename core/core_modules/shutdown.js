var shutdownResponses = ['Good Night', 'I don\'t blame you.', 'There you are.', 'Please.... No, Noooo!'];

exports.match = function (text, commandPrefix) {
  return text === commandPrefix + 'shutdown';
};

exports.run = function(api, event) {
  var index = Math.floor(Math.random() * shutdownResponses.length);
  api.sendMessage(shutdownResponses[index], event.thread_id);
  this.shutdown();
  return false;
};

exports.help = function(commandPrefix) {
  return [[commandPrefix + 'shutdown','Shuts down the platform']];
};
