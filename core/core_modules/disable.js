// TODO Persistent config (counterLimit and disabled state) fairly acheivable by getting and setting properties in exports.platform.modules.disabledConfig
// TODO Update local var setup after doing the above


var prevTimeStamp;
var isThreadDisabled = {},
possibleSpam = false;
var counter = 0,
counterLimit = 3;
var msgIndexDisable = 0,
msgIndexEnable = 0;
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
  prevTimeStamp = Date.now();
};

exports.match = function(event, commandPrefix) {
  // Add disabled flag for thread if it doesn't already exists
  if(!isThreadDisabled.hasOwnProperty(event.thread_id)) {
    isThreadDisabled[event.thread_id] = false;
  }

  if(event.body === commandPrefix + commands[0]) {
    msgIndexEnable = 0;
    msgIndexDisable = 1;
    return true;
  } else if (!isThreadDisabled[event.thread_id] && event.body.startsWith(commandPrefix)) { // Avoids counting if already disabled
    counter += Date.now() - prevTimeStamp <= 1000 ? 1 : 0;
    prevTimeStamp = Date.now();

    possibleSpam = counter > counterLimit;
    if(possibleSpam) {
      counter = 0;
      msgIndexEnable = 2;
      msgIndexDisable = 3;
      return true;
    }
  }
  return isThreadDisabled[event.thread_id];
};

exports.run = function(api, event) {
  if (event.body === commandPrefix + commands[1] + commandPrefix + commands[2]) { // Command /disable /counter <value>
    counterLimit = parseInt(event.body.substring((commandPrefix + commands[1] + commandPrefix + commands[2]).length, event.body.length));
    if(isNaN(counterLimit)){
      counterLimit = 3;
      api.sendMessage(messages[4] + ' ' + event.sender_name, event.thread_id);
    } else{
      api.sendMessage(messages[5] + ' ' + event.sender_name, event.thread_id);
    }
    return false;

  } else if (event.body === commandPrefix + commands[1] + commandPrefix + commands[3]) { // Command /disable /timer <seconds>
    var seconds = parseFloat(event.body.substring((commandPrefix + commands[1] + commandPrefix + commands[3]).length, event.body.length));
    if(isNaN(seconds)){
      api.sendMessage(messages[4] + ' ' + event.sender_name, event.thread_id);
    } else{
      setTimeout(function(){
        isThreadDisabled[event.thread_id] = !isThreadDisabled[event.thread_id];
      }, seconds * 1000);
      api.sendMessage(messages[5] + ' ' + event.sender_name, event.thread_id);
    }
    return false;

  } else if (event.body === commandPrefix + commands[1] + commandPrefix + commands[4]) { // Command /disable /default
    counterLimit = 3;
    return false;

    // Only change disable state if explictly called or counter crossed limit
  } else if (event.body === api.commandPrefix + commands[0] || possibleSpam) { // Main branch
    if (isThreadDisabled[event.thread_id]	) {
      api.sendMessage(messages[msgIndexEnable] + ' ' + event.sender_name, event.thread_id);
    }
    else {
      api.sendMessage(messages[msgIndexDisable], event.thread_id);
    }
    isThreadDisabled[event.thread_id] = !isThreadDisabled[event.thread_id];
    possibleSpam = false;
  }
  return false;
};

exports.help = function(commandPrefix) {
  return [[commandPrefix + 'disable', 'Disables the platform',
  'Stops the platform from responding to messages it receives based on message frequency (default 3/sec) or by the command.\nTo renable send the disable command again']];
};
