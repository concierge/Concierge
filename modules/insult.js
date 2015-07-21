var reddit = require('redwrap'),
    request = require('request');

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str){
        return this.indexOf(str) === 0;
    };
}

exports.match = function(text) {
    return text.startsWith('/insult');
};

exports.help = function() {
    return '/insult : Will almost certainly return profanity.';
};

exports.insult = function(callback) {
    reddit.r('insults').limit(100, function(err, req, res){
        if (err || req !== null || req !== undefined) {
            var index = Math.floor(Math.random() * req.data.children.length);
            callback(req.data.children[index].data.title);
        }
        else {
            callback("Well shit insult fucked up");
        }
    });

};

exports.run = function(api, event) {
    exports.insult(function(result) {
        api.sendMessage(result, event.thread_id);
    });
};

exports.load = function() {};