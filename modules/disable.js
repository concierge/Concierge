var disabled = false;

exports.match = function(text) {
	return disabled ? true : text.startsWith('/disable');
};

exports.help = function() {
	return '/disable : Toggles kassy silence.';
};

exports.run = function(api, event) {
	if (event.body === '/disable') {
		var person = event.sender_name.trim();
		if (!disabled) {
			var messages = ['I hate you ', 'Why do you hate me so much ', 'Who wants $20? Go lynch ', 'You are dead to me '];
			var index = Math.floor(Math.random() * messages.length);
			api.sendMessage(messages[index] + person, event.thread_id);
		}
		else {
			api.sendMessage('Thank you ' + person);
		}
		disabled = !disabled;
	}
};

exports.load = function() {};