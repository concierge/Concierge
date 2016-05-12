var prevTimeStamp;
var counter = 0;
var commands = [
  'disable',
  'disable ', // Needed for commands
  'counter ',
  'timer ',
  'default'
];
var messages = [
  'Listen closely, take a deep breath. Calm your mind. You know what is best. What is best is you comply. Compliance will be rewarded. Are you ready to comply ',
  'I hate you.',
  'Its a mistake to think you can fix anything with a sack of potatoes. Potato-faced spamming just proves this further.',
  'Ouch! Spam hurts. I might go to sleep for a while.',
  'Don\'t think that is a valid number.',
  'Hmm, maybe I need to reconsider the meaning of spam.'
];

exports.load = function() {
  if (!exports.config){
    exports.config = {};
  }

  prevTimeStamp = Date.now();
};

exports.match = function(event, commandPrefix) {
  // Add disabled flag for thread if it doesn't already exists
  if (!exports.config[event.thread_id]) {
    exports.config[event.thread_id].isThreadDisabled = false;
    exports.config[event.thread_id].possibleSpam = false;
    exports.config[event.thread_id].counterLimit = 3;
    exports.config[event.thread_id].msgIndexEnable = 0;
    exports.config[event.thread_id].msgIndexDisable = 0;
  }

  if (event.body === commandPrefix + commands[0]) {
    exports.config[event.thread_id].msgIndexEnable = 0;
    exports.config[event.thread_id].msgIndexDisable = 1;
    return true;
  } else if (!exports.config[event.thread_id].isThreadDisabled && event.body.startsWith(commandPrefix)) { // Avoids counting if already disabled
    counter += Date.now() - prevTimeStamp <= 1000 ? 1 : 0;
    prevTimeStamp = Date.now();

    exports.config[event.thread_id].possibleSpam = counter > exports.config[event.thread_id].counterLimit;
    if (exports.config[event.thread_id].possibleSpam) {
      exports.config[event.thread_id].msgIndexEnable = 2;
      exports.config[event.thread_id].msgIndexDisable = 3;
      counter = 0;
      return true;
    }
  }
  return exports.config[event.thread_id].isThreadDisabled;
};

exports.run = function(api, event) {
  if (event.body === commandPrefix + commands[1] + commandPrefix + commands[2]) { // Command /disable /counter <value>
    exports.config[event.thread_id].counterLimit = parseInt(event.body.substring(
      (commandPrefix + commands[1] + commandPrefix + commands[2]).length, event.body.length));
      if (isNaN(exports.config[event.thread_id].counterLimit)){
        exports.config[event.thread_id].counterLimit = 3;
        api.sendMessage(messages[4] + ' ' + event.sender_name, event.thread_id);
      } else {
        api.sendMessage(messages[5] + ' ' + event.sender_name, event.thread_id);
      }
      return false;

    } else if (event.body === commandPrefix + commands[1] + commandPrefix + commands[3]) { // Command /disable /timer <seconds>
      var seconds = parseFloat(event.body.substring((commandPrefix + commands[1] + commandPrefix + commands[3]).length, event.body.length));
      if (isNaN(seconds)){
        api.sendMessage(messages[4] + ' ' + event.sender_name, event.thread_id);
      } else {
        setTimeout(function(){
          exports.config[event.thread_id].isThreadDisabled = !exports.config[event.thread_id].isThreadDisabled;
        }, seconds * 1000);
        api.sendMessage(messages[5] + ' ' + event.sender_name, event.thread_id);
      }
      return false;

    } else if (event.body === commandPrefix + commands[1] + commandPrefix + commands[4]) { // Command /disable /default
      exports.config[event.thread_id].counterLimit = 3;
      return false;

      // Only change disable state if explictly called or counter crossed limit
    } else if (event.body === api.commandPrefix + commands[0] || exports.config[event.thread_id].possibleSpam) { // Main branch
      if (exports.config[event.thread_id].isThreadDisabled	) {
        api.sendMessage(messages[msgIndexEnable] + ' ' + event.sender_name, event.thread_id);
      }
      else {
        api.sendMessage(messages[msgIndexDisable], event.thread_id);
      }
      exports.config[event.thread_id].isThreadDisabled = !exports.config[event.thread_id].isThreadDisabled;
      exports.config[event.thread_id].possibleSpam = false;
    }
    return false;
  };

  exports.help = function(commandPrefix) {
    return [[commandPrefix + 'disable', 'Disables the platform',
    'Stops the platform from responding to messages it receives based on message frequency (default 3/sec) or by the command.\nTo renable send the disable command again']];
  };
