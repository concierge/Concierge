let fs = require('fs'),
    path = require('path'),
    urlMatcher = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/,
    imageExts = ['.jpg','.png','.gif','.gifv','.tif','.tiff','.jpeg'];

let getType = function(message) {
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

let Responder = class {
    constructor(api, event, match, message) {
        this.api = api;
        this.event = event;
        this.match = match;
        this.message = message;
    }

    random(arr) {
        return this.api.random(arr);
    }

    send() {
        for (var i = 0; i < arguments.length; i++) {
            switch (getType(arguments[i])) {
            case 'message':
                this.api.sendMessage(arguments[i], this.event.thread_id);
                break;
            case 'url':
                this.api.sendUrl(arguments[i], this.event.thread_id);
                break;
            case 'image':
                this.api.sendImage('url', arguments[i], '', this.event.thread_id);
                break;
            case 'file':
                this.api.sendFile('file', arguments[i], '', this.event.thread_id);
                break;
            }
        }
    }

    http() {
        return this.api.http.apply(this, arguments);
    }
};

Responder.prototype.emote = Responder.prototype.send;
Responder.prototype.reply = Responder.prototype.send;

module.exports = Responder;
