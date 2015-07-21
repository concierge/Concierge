var associateMap = {};

exports.help = function() {
	return '/associate "<hook>" "<text>" : Associate and disassociate a phrase with another.';
};

exports.match = function(text, thread, api) {
	if (text.startsWith('/associate')) {
		return true;
	}
	
	var s = text.toLowerCase();
	for (var assoc in associateMap[thread]) {
		if (text.indexOf(assoc.toLowerCase()) !== -1) {
			if (api) {
				api.sendMessage(associateMap[thread][assoc], thread);
			}
			return true;
		}
	}
	return false;
};

exports.toggleAssociation = function(thread, hook, text) {
	if (associateMap[thread] && associateMap[thread][hook] && !text) {
		delete associateMap[thread][hook];
		return false;
	}
	
	if (!associateMap[thread]) {
		associateMap[thread] = {};
	}
	associateMap[thread][hook] = text;
	return true;
};

exports.load = function(){};

exports.run = function(api, event) {
	if (!event.body.startsWith('/associate')) {
		exports.match(event.body, event.thread_id, api);
		return;
	}
	
	var spl = event.body.split('"');
	if (spl.length !== 3 && spl.length !== 5)  {
		api.sendMessage('WTF are you doing????!', event.thread_id);
		return;
	}
	
	exports.toggleAssociation(event.thread_id, spl[1], spl[3]);
	api.sendMessage('Association changed.', event.thread_id);
};