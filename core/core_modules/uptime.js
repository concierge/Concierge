var startTime;

exports.match = function(text) {
  return text === this.commandPrefix + 'uptime';
};

exports.run = function(api, event) {
  var date = new Date(),
    seconds = (date.getTime() - startTime.getTime()) / 1000;
  api.sendMessage('I\'ve been alive for ' + seconds + ' seconds.', event.thread_id);
  return false;
};

exports.load = function() {
  startTime = new Date();
};
