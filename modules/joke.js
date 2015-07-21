var reddit = require('redwrap'),
    request = require('request');

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str){
        return this.indexOf(str) === 0;
    };
}

exports.match = function(text) {
    return text.startsWith('/joke');
};

exports.help = function() {
    return '/joke : A mixed bag of fun.';
};

exports.joke = function(callback) {
    reddit.r('jokes').limit(100, function(err, req, res){
        if (err || req !== null || req !== undefined) {

            var index = Math.floor(Math.random() * req.data.children.length),
                title,
                text;
            title = req.data.children[index].data.title;
            text = req.data.children[index].data.selftext;
            callback(title + '\n' + text);
        }
        else {
            callback("Well shit jokes fucked up");
        }
    });

};

exports.run = function(api, event) {
    exports.joke(function(result) {
        api.sendMessage(result, event.thread_id);
    });
};

exports.load = function() {};