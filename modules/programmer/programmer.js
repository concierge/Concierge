var reddit = require('./../common/reddit.js'),
    request = require.safe('request'),
    results = [];

exports.match = function(text, commandPrefix) {
    return text.startsWith(commandPrefix + 'programmer');
};

exports.help = function(commandPrefix) {
    return [[commandPrefix + 'programmer','Reactions of a programmer.']];
};

exports.reaction = function(callback, waitCallback) {
    // If we have no stored reactions, get some
    if (typeof results === 'undefined' || results === null || results.length === 0) {
		waitCallback();
        reddit.reddit('programmerreactions', 200, function (err, data) {
            if (!err) {
                results = data;
                exports.getReaction(callback);
            }
            else {
                callback(data);
            }
        });
    }
    else {
        exports.getReaction(callback);
    }
};

exports.getReaction = function(callback) {
    // Get some random reaction

    var index = Math.floor(Math.random() * results.length),
        title = results[index].data.title,
        text = results[index].data.selftext,
		url = results[index].data.url;
		
    // Delete the reaction, so we don't get it again
    results.splice(index, 1);

    callback({title:title, body:text, url:url});
};

exports.run = function(api, event) {
    exports.reaction(function(result) {
		if (result.url != null) {
			api.sendImage('url', result.url, result.title, event.thread_id);
		}
		else {
			api.sendMessage(result.title, event.thread_id);
			api.sendMessage(result.body, event.thread_id);
		}
    },
	function() {
		api.sendTyping(event.thread_id);
	});
};
