// TODO Should send a different message if caused by the counter (should extract all messages into an array)

// TODO Should be made configurable by sending /disable /counter <counterLimit> (any state is fine)
// TODO Should flick disabled state using a timer by setting a timer /disable /timer <seconds> (any state is fine)
// TODO Should be able to reset to default settings /disable /default (any state is fine, only defaults the configuration)

// TODO Persistent config (counterLimit and disabled state) fairly acheivable by getting and setting properties in exports.platform.modules.disabledConfig
// TODO Update local var setup after doing the above

// TODO Should store disable states for each separate thread_id

var prevTimeStamp;
var isThreadDisabled = {},
    possibleSpam = false;
var counter = 0,
    counterLimit = 3;
var msgIndexDisable = 0,
    msgIndexEnable = 0,
    messages = {
	    'Listen closely, take a deep breath. Calm your mind. You know what is best. What is best is you comply. Compliance will be rewarded. Are you ready to comply ',
	    'I hate you.',
	    'It is a mistake to think you can fix anything with a sack of potatoes. Potato-faced spamming just proves this further.'
	    'Ouch! Spam hurts. I might go to sleep for a while.',
}

exports.load = function() {
	prevTimeStamp = Date.now();
};

exports.match = function(event, commandPrefix) {
	if(!isThreadDisabled.hasOwnProperty(event.thread_id)) { // Add disabled flag for thread if it doesn't already exists
		isThreadDisabled[event.thread_id] = false;
	}

	if(event.body === commandPrefix + 'disable') {
		msgIndexEnable = 0;
		msgIndexDisable = 1;
		return true;
	} else if (!isThreadDisabled[event.thread_id] && event.body.startsWith(commandPrefix)) { // Avoids counting if already disabled
		counter += Date.now() - prevTimeStamp <= 1000 ? 1 : 0;
		prevTimeStamp = Date.now();

		if(possibleSpam = (counter > counterLimit)) {
 			counter = 0;
			msgIndexEnable = 2;
			msgIndexDisable = 3;
 			return true;
 		}
	}
	return isThreadDisabled[event.thread_id];
};

exports.run = function(api, event) {
	// Only change disable state if explictly called or counter crossed limit
	// TODO Check for /disable <things> here
	if (event.body === api.commandPrefix + 'disable' || counter > counterLimit) {
		if (isThreadDisabled[event.thread_id]	) {
			api.sendMessage(messages[msgIndexEnable] + event.sender_name, event.thread_id);
		}
		else {
			api.sendMessage(messages[msgIndexDisable], event.thread_id);
		}
		isThreadDisabled[event.thread_id] = !isThreadDisabled[event.thread_id];
		counter = 0;
	}
	return false;
};

exports.help = function(commandPrefix) {
	return [[commandPrefix + 'disable', 'Disables the platform',
	'Stops the platform from responding to messages it receives based on message frequency (default 3/sec) or by the command.\nTo renable send the disable command again']];
};
