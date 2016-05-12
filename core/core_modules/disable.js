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

if (!this.config.registeredThreads){
  this.config.registeredThreads = {};
}
if (!this.config.isThreadDisabled){
  this.config.isThreadDisabled = {};
}
if (!this.config.possibleSpam){
  this.config.possibleSpam = {};
}
if (!this.config.counterLimit){
  this.config.counterLimit = {};
}
if (!this.config.msgIndexEnable){
  this.config.msgIndexEnable = {};
}
if (!this.config.msgIndexDisable){
  this.config.msgIndexDisable = {};
}

exports.load = function() {
  prevTimeStamp = Date.now();
};

exports.match = function(event, commandPrefix) {
  // Add disabled flag for thread if it doesn't already exists
  if (!this.config.registeredThreads[event.thread_id]) {
    this.config.registeredThreads[event.thread_id] = true;
    this.config.isThreadDisabled[event.thread_id] = false;
    this.config.possibleSpam[event.thread_id] = false;
    this.config.counterLimit[event.thread_id] = 3;
    this.config.msgIndexEnable[event.thread_id] = 0;
    this.config.msgIndexDisable[event.thread_id] = 0;
  }

  if (event.body === commandPrefix + commands[0]) {
    this.config.msgIndexEnable[event.thread_id] = 0;
    this.config.msgIndexDisable[event.thread_id] = 1;
    return true;
  } else if (!this.config.isThreadDisabled[event.thread_id] && event.body.startsWith(commandPrefix)) { // Avoids counting if already disabled
    counter += Date.now() - prevTimeStamp <= 1000 ? 1 : 0;
    prevTimeStamp = Date.now();

    this.config.possibleSpam[event.thread_id] = counter > this.config.counterLimit[event.thread_id];
    if (this.config.possibleSpam[event.thread_id]) {
      counter = 0;
      this.config.msgIndexEnable[event.thread_id] = 2;
      this.config.msgIndexDisable[event.thread_id] = 3;
      return true;
    }
  }
  return this.config.isThreadDisabled[event.thread_id];
};

exports.run = function(api, event) {
  if (event.body === commandPrefix + commands[1] + commandPrefix + commands[2]) { // Command /disable /counter <value>
    this.config.counterLimit[event.thread_id] = parseInt(event.body.substring(
      (commandPrefix + commands[1] + commandPrefix + commands[2]).length, event.body.length));
    if (isNaN(this.config.counterLimit[event.thread_id])){
      this.config.counterLimit[event.thread_id] = 3;
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
        this.config.isThreadDisabled[event.thread_id] = !this.config.isThreadDisabled[event.thread_id];
      }, seconds * 1000);
      api.sendMessage(messages[5] + ' ' + event.sender_name, event.thread_id);
    }
    return false;

  } else if (event.body === commandPrefix + commands[1] + commandPrefix + commands[4]) { // Command /disable /default
    this.config.counterLimit[event.thread_id] = 3;
    return false;

    // Only change disable state if explictly called or counter crossed limit
  } else if (event.body === api.commandPrefix + commands[0] || this.config.possibleSpam[event.thread_id]) { // Main branch
    if (this.config.isThreadDisabled[event.thread_id]	) {
      api.sendMessage(messages[msgIndexEnable] + ' ' + event.sender_name, event.thread_id);
    }
    else {
      api.sendMessage(messages[msgIndexDisable], event.thread_id);
    }
    this.config.isThreadDisabled[event.thread_id] = !this.config.isThreadDisabled[event.thread_id];
    this.config.possibleSpam[event.thread_id] = false;
  }
  return false;
};

exports.help = function(commandPrefix) {
  return [[commandPrefix + 'disable', 'Disables the platform',
  'Stops the platform from responding to messages it receives based on message frequency (default 3/sec) or by the command.\nTo renable send the disable command again']];
};
