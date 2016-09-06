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
        this.envelope = message;
    }

    random(arr) {
        return this.api.random(arr);
    }

    _internalSend(thread_id, data) {
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
    }

    send() {
        this._internalSend(this.event.thread_id, arguments);
    }

    emote() {
        this.send.apply(this, arguments);
    }

    reply() {
        this.send.apply(this, arguments);
    }

    messageRoom(room, strings) {
        this._internalSend(room, strings);
    }

    http() {
        return this.api.http.apply(this, arguments);
    }
};

module.exports = Responder;
