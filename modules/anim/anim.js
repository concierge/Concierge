var request = require.safe('request'),
	animCache = {};

exports.match = function(text, commandPrefix) {
	return text.startsWith(commandPrefix + 'anim');
};

exports.help = function() {
	return [[this.commandPrefix + 'anim <query>','Searches for animated GIF.']];
};

exports.search = function (query, callback, waitCallback) {
	var cacheq = query.trim().toLowerCase();
	var index = 0;
	if (animCache[cacheq]) {
		if (new Date().getTime() - animCache[cacheq].dt > 86400000
			|| animCache[cacheq].index + 1 == animCache[cacheq].length) {
			delete animCache[cacheq];
		}
		else {
			animCache[cacheq].index++;
			index = animCache[cacheq].index;
		}
	}

	waitCallback();
	
	var q = {
		q: query,
		cx: exports.config.apiSearchID,
		searchType: 'image',
		fileType: 'gif',
		safe: 'high',
		key: exports.config.apiKey
	};

	request.get({url: 'https://www.googleapis.com/customsearch/v1/', qs: q}, function(error, response, body) {
		body = JSON.parse(body);
		if (response.statusCode === 200 && body && body.items) {
			var images = body.items;
			if (images && images.length > 0) {
				var image = images[index];
				if (!animCache[cacheq]) {
					animCache[cacheq] = {
						dt: new Date(),
						index: index,
						length: images.length
					};
				}
				callback(image);
			}
			else {
				callback({error:'No images found.'});
			}
		}
		else {
			callback({error:'Whomever the system admin is around here, I demand that they should be fired.'});
		}
	});
};

// Taken from sassy. Copyright sassy authors
exports.ensureExt = function (url) {
	if (!/(\.gif|\.jpe?g|\.png|\.gifv)$/i.test(url)) {
		url += '#.png';
	}
	return url;
}

exports.run = function(api, event) {
	if (!exports.config.apiKey) {
		api.sendMessage("My admin needs to give me a Google API key before anim will work.\nPlease set the value apiKey in config.json to a Google Custom Search API key.", event.thread_id);
		return;
	}
	
	if (!exports.config.apiSearchID) {
		api.sendMessage("My admin needs to give me a Google API search ID before anim will work.\nPlease set the value apiSearchID in config.json to a Google Custom Search API search engine ID.", event.thread_id);
		return;
	}
	
	var query = event.body.substr(6);
	exports.search(query, function(image) {
		if (image.error) {
			api.sendMessage(image.error, event.thread_id);
			return;
		}
		
		var img = image.link;
		if (img) {
			var url = exports.ensureExt(img);
			api.sendImage("url", url, "I found this:", event.thread_id);
		}
		else {
			api.sendMessage("Something went very wrong.", event.thread_id);
		}
	},
	function() {
		api.sendTyping(event.thread_id);
	});
};
