const fs = require('fs'),
    path = require('path'),
    urlMatcher = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/,
    imageExts = ['.jpg', '.png', '.gif', '.gifv', '.tif', '.tiff', '.jpeg'];

class Message {
    constructor(event, prefix) {
        this.event = event;
        this.prefix = prefix;

        this.room = event.thread_id;
        this.text = event.body;
        this.user = {
            name: event.sender_name,
            id: event.sender_id,
            email_address: `${event.sender_name}@unknown.com`
        };
    }
}

class Responder {
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

    static _getType(message) {
        try {
            fs.statSync(message);
            return 'file';
        }
        catch (e) { }

        if (!urlMatcher.test(message)) {
            return 'message';
        }

        const ext = path.extname(message);
        if (imageExts.includes(ext)) {
            return 'image';
        }
        return 'url';
    }

    _internalSend(threadId, data) {
        for (let i = 0; i < data.length; i++) {
            switch (Responder._getType(data[i])) {
            case 'message':
                this.api.sendMessage(data[i], threadId);
                break;
            case 'url':
                this.api.sendUrl(data[i], threadId);
                break;
            case 'image':
                this.api.sendImage('url', data[i], '', threadId);
                break;
            case 'file':
                this.api.sendFile('file', data[i], '', threadId);
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
}

exports.Responder = Responder;
exports.Message = Message;
