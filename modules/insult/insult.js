var reddit = require('./../common/reddit.js'),
    results = [];

exports.insult = function(callback, waitCallback) {
    // If we have no stored insults, get some
    if (results === undefined || results === null || results.length === 0) {
        waitCallback();
        reddit.reddit('insults', 200, function (err, data) {
            if (!err) {
                results = data;
                exports.fuckNode(callback);
            }
            else {
                callback(data);
            }
        });
    }
    else {
        exports.fuckNode(callback);
    }
};

exports.fuckNode = function(callback) {
    // Get some random insult

    var index = Math.floor(Math.random() * results.length),
        title = results[index].data.title,
        text = results[index].data.selftext;

    // Delete the insult, so we don't get it again
    results.splice(index, 1);

    callback(title + '\n' + text);
};

exports.run = function(api, event) {
    exports.insult(function(result) {
        api.sendMessage(result, event.thread_id);
    },
    function() {
        api.sendTyping(event.thread_id);
    });
};
