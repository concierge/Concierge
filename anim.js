var request = require('request');

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.indexOf(str) === 0;
	};
}

exports.match = function(text) {
	return text.startsWith('/anim');
};

exports.help = function() {
	return '/anim <query> : Searches for animated GIF.';
};

exports.search = function (query, callback) {
	var q = {v: '1.0', rsz: '8', q: query, safe: 'active', imgtype: 'animated'};
	
	request.get({url: 'http://ajax.googleapis.com/ajax/services/search/images', qs: q}, function(error, response, body) {
		if (response.statusCode === 200 && response.body) {
			var images = JSON.parse(response.body);
			if (images.responseData) {
				images = images.responseData.results;
				if (images && images.length > 0) {
					var index = Math.floor(Math.random() * images.length);
					var image = images[index];
					callback(image);
				}
				else {
					callback({error:'No images found.'});
				}
			}
			else {
				callback({error:'Google images sucks.'});
			}
		}
		else {
			callback({error:'Whomever the system admin is around here, I demand that they should be fired.'});
		}
	});
};

exports.run = function(api, event) {
	var query = event.body.substr(6);
	exports.search(query, function(image) {
		api.sendMessage(image.url, event.thread_id);
	});
};

exports.load = function() {};