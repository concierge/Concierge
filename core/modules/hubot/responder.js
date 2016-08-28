var http = require('scoped-http-client'),
    fs = require('fs'),
    path = require('path'),
    urlMatcher = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/,
    imageExts = ['.jpg','.png','.gif','.gifv','.tif','.tiff','.jpeg'];

var getType = function(message) {
    try {
        fs.statSync(message);
        return 'file';
    }
    catch(e){}

    if (!urlMatcher.test(message)) {
        return 'message';
    }

    var ext = path.extname(message);
    if (imageExts.includes(ext)) {
        return 'image';
    }
    return 'url';
};

var Responder = function (api, event, match, message) {
    this.api = api;
    this.event = event;
    this.match = match;
    this.message = message;
    this.envelope = message;
};

Responder.prototype.random = function (arr) {
    return arr[Math.floor(Math.random() * arr.length)];
};

Responder.prototype._internalSend = function (thread_id, data) {
    for (var i = 0; i < data.length; i++) {
        switch (getType(data[i])) {
        case 'message':
            this.api.sendMessage(data[i], thread_id);
            break;
        case 'url':
            this.api.sendUrl(data[i], thread_id);
            break;
        case 'image':
            this.api.sendImage('url', data[i], '', thread_id);
            break;
        case 'file':
            this.api.sendFile('file', data[i], '', thread_id);
            break;
        }
    }
};

Responder.prototype.send = function () {
    this._internalSend(this.event.thread_id, arguments);
};

Responder.prototype.messageRoom = function (room, strings) {
    this._internalSend(room, strings);
};

Responder.prototype.emote = Responder.prototype.send;
Responder.prototype.reply = Responder.prototype.send;
Responder.prototype.http = http.create;

module.exports = Responder;
