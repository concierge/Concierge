exports.match = function(text, commandPrefix) {
	return text === commandPrefix + 'creator';
};

exports.run = function(api, event) {
	var creators = [
		'Thank you to:',
		'- Matthew Knox my awesome creator about whom nobody is allowed to insult.',
		'- Dion Woolley for my slackiness and his random contributions.',
		'- Jay Harris for my fawltyness and profoundness of being.',
		'- James Fairbairn for veing va vampire.',
		'- and the other weird people who contributed to me.'
	];
	api.sendMessage(creators.join('\n'), event.thread_id);
	return false;
};
