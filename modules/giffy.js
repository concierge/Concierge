var require_install = require('require-install'),
  request = require_install('request'),
  apiKey = "dc6zaTOxFJmzC",
	giffyCache = {}; // yes...

exports.match = function(text) {
	return text.startsWith(this.platform.commandPrefix + 'gif');
};

exports.help = function() {
	return this.platform.commandPrefix + 'gif <query> : Searches for animated GIF.';
};

exports.search = function (query, callback) {
	var cacheq = query.trim().toLowerCase();
	var index = 0;
	if (giffyCache[cacheq]) {
		if (new Date().getTime() - v[cacheq].dt > 86400000
			|| giffyCache[cacheq].index + 1 == giffyCache[cacheq].length) {
			delete giffyCache[cacheq];
		}
		else {
			giffyCache[cacheq].index++;
			index = giffyCache[cacheq].index;
		}
	}

	request.get({url: 'http://api.giphy.com/v1/gifs/search',
    qs: {
      q: query,
      imit: 10,
      api_key: apiKey,
      rating: 'pg-13'
    }
  }, function(error, response, body) {
		if (response.statusCode === 200 && response.body) {
			var images = JSON.parse(response.body);
			if (images.data) {
				images = images.data;
				if (images && images.length > 0) {
					var image = images[index].url;
					if (!giffyCache[cacheq]) {
						giffyCache[cacheq] = {
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
				callback({error:'Giphy sucks.'});
			}
		}
		else {
			callback({error:'Whomever the system admin is around here, I demand that they should be fired.'});
		}
	});
};

// Taken from sassy. Copyright sassy authors
exports.ensureExt = function (url) {
	if (!/(.gif|.jpe?g|.png|.gifv)$/i.test(url)) {
		url += '#.png';
	}
	return url;
}

exports.run = function(api, event) {
	var query = event.body.substr(6);
	exports.search(query, function(image) {
		if (image) {
			var url = exports.ensureExt(image);
			api.sendImage("url", url, "I found this:", event.thread_id);
		}
		else {
			api.sendMessage("Something went very wrong.", event.thread_id);
		}
	});
};
