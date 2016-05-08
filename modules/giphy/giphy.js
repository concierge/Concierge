var request = require.safe('request'),
    giphyCache = {};

exports.search = function (query, callback, waitCallback) {
    var cacheq = query.trim().toLowerCase();
    var index = 0;
    if (giphyCache[cacheq]) {
        if (new Date().getTime() - giphyCache[cacheq].dt > 86400000
            || giphyCache[cacheq].index + 1 == giphyCache[cacheq].length) {
            delete giphyCache[cacheq];
        }
        else {
            giphyCache[cacheq].index++;
            index = giphyCache[cacheq].index;
        }
    }

    waitCallback();

    var q = {
        q: query,
        limit: 10,
        api_key: exports.config.apiKey,
        rating: 'pg-13'
    };

    request.get({url: 'http://api.giphy.com/v1/gifs/search', qs: q}, function(error, response, body) {
        body = JSON.parse(body);
        if (response.statusCode === 200 && body && body.data) {
            var images = body.data;
            if (images && images.length > 0) {
                var image = images[index].url;
                if (!giphyCache[cacheq]) {
                    giphyCache[cacheq] = {
                        dt: new Date(),
                        index: index,
                        length: images.length
                    };
                }
                callback({url: image});
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
    if (!/(.gif|.jpe?g|.png|.gifv)$/i.test(url)) {
        url += '#.png';
    }
    return url;
};

exports.run = function(api, event) {
    if (!exports.config.apiKey) {
        api.sendMessage("My admin needs to give me a Giphy API key before gif will work.\nPlease set the value apiKey in config.json to a Giphy API key.", event.thread_id);
        return;
    }

    var query = event.arguments_body;

    if(!query || query.length == 0) {
        api.sendMessage("Of course, I'll look for an empty string!", event.thread_id);
        return;
    }

    exports.search(query, function(image) {
            if (image.hasOwnProperty('url')) {
                var url = exports.ensureExt(image.url);
                api.sendImage("url", url, "I found this:", event.thread_id);
            }
            else if(image.hasOwnProperty('error')) {
                api.sendMessage(image.error, event.thread_id);
            }
            else {
                api.sendMessage("Something went very wrong.", event.thread_id);
            }
        },
        function() {
            api.sendTyping(event.thread_id);
        });
};
