exports.match = function(text) {
  return this.commandPrefix + 'shutdown';
};

exports.run = function(api, event) {
  var shutdownResponses = ['Good Night', 'I don\'t blame you.', 'There you are.', 'Please.... No, Noooo!'];
  var index = Math.floor(Math.random() * shutdownResponses.length);
  api.sendMessage(shutdownResponses[index], event.thread_id);
  exports.shutdown();
  return false;
};
