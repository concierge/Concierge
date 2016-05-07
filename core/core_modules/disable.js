var disabled = false;

exports.match = function(event, commandPrefix) {
	return disabled || event.body === commandPrefix + 'disable';
};

exports.run = function(api, event) {
	if (event.body === api.commandPrefix + 'disable') {
		if (disabled) {
			api.sendMessage('I hate you.', event.thread_id);
		}
		else {
			api.sendMessage('Listen closely, take a deep breath. Calm your mind. You know what is best. ' +
				'What is best is you comply. Compliance will be rewarded. Are you ready to comply ' +
				event.sender_name + '?', event.thread_id);
		}
		disabled = !disabled;
	}
	return false;
};

exports.help = function(commandPrefix) {
	return [[commandPrefix + 'disable','Disables the platform', 'Stops the platform from responding to messages it receives.\nTo renable send the disable command again']];
};
