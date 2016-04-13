var http = require('scoped-http-client');

var Responder = function (api, event, match, message) {
    this.api = api;
    this.event = event;
    this.match = match;
    this.message = message;
};

Responder.prototype.random = function (arr) {
    return arr[Math.floor(Math.random() * arr.length)];
};

Responder.prototype.send = function () {
    for (var i = 0; i < arguments.length; i++) {
        this.api.sendMessage(arguments[i], this.event.thread_id);
    }
};

Responder.prototype.emote = Responder.prototype.send;
Responder.prototype.reply = Responder.prototype.send;
Responder.prototype.http = http.create;

module.exports = Responder;