// TODO Should send a different message if caused by the counter (should extract all messages into an array)
// TODO Should be made configurable by sending /disable /counter <counterLimit> (any state is fine)
// TODO Should flick disabled state using a timer by setting a timer /disable /timer <seconds> (any state is fine)
// TODO Should be able to reset to default settings /disable /default (any state is fine, only defaults the configuration)
// TODO Persistent config (counterLimit and disabled state) fairly acheivable by getting and setting properties in exports.platform.modules.disabledConfig
// TODO Update local var setup after doing the above
// TODO Should store disable states for each separate thread_id

var isDisabled = false;
var prevTimeStamp;
var counter = 0;
var counterLimit = 3;

exports.load = function() {
	prevTimeStamp = Date.now();
};

exports.match = function(text, commandPrefix) {
	text += ""; // TODO #PATCH stringifying for handling all kinds of match calls
	if(text === commandPrefix + 'disable') {
		return true;
	} else if (!isDisabled && text.startsWith(commandPrefix)) { // Avoids counting if already disabled
		counter += Date.now() - prevTimeStamp <= 1000 ? 1 : 0;
		prevTimeStamp = Date.now();

		return counter > counterLimit;
	}
	return isDisabled;
};

exports.run = function(api, event) {
	// Only change disable state if explictly called or counter crossed limit
	// TODO Check for /disable <things> here
	if (event.body === api.commandPrefix + 'disable' || counter > counterLimit) {
		if (isDisabled) {
			api.sendMessage('Listen closely, take a deep breath. Calm your mind. You know what is best. ' +
			'What is best is you comply. Compliance will be rewarded. Are you ready to comply ' +
			event.sender_name + '?', event.thread_id);
		}
		else {
			api.sendMessage('I hate you.', event.thread_id);
		}
		isDisabled = !isDisabled;
		counter = 0;
	}
	return false;
};

exports.help = function(commandPrefix) {
	return [[commandPrefix + 'disable','Disables the platform',
	'Stops the platform from responding to messages it receives based on message frequency (default 3/sec) or by the command.\nTo renable send the disable command again']];
};
