var isDisabled = false;
var prevTimeStamp;
var counterLimit = 3; // TODO Should be made configurable by sending /disable <counterLimit>

exports.load = function() {
	prevDate = Date.now();
}

exports.match = function(text, commandPrefix) {
	if(text === commandPrefix + 'disable') {
		isDisabled = !isDisabled;
		return true;
	} else if(!isDisabled && text.startsWith(commandPrefix)) { // Avoids counting if already disabled
		counter += Date.now() - prevTimeStamp <= 1000 ? 1 : 0;
		prevTimeStamp = Date.now();

		if(counter > counterLimit) {
			counter = 0;
			isDisabled = !isDisabled;
			return true;
		}
	}
	return false;
};

exports.run = function(api, event) {
		if (isDisabled) {
			api.sendMessage('I hate you.', event.thread_id);
		}
		else {
			api.sendMessage('Listen closely, take a deep breath. Calm your mind. You know what is best. ' +
			'What is best is you comply. Compliance will be rewarded. Are you ready to comply ' +
			event.sender_name + '?', event.thread_id);
		}
	return false;
};

exports.help = function(commandPrefix) {
	return [[commandPrefix + 'disable','Disables the platform',
	'Stops the platform from responding to messages it receives based on message frequency (default 3/sec) or by the command.\nTo renable send the disable command again']];
};
