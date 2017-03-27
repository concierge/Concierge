const WebSocket = require('ws');

class Client {
    constructor() {
        this.callback = null;
        this.stopCallback = null;
        this.messageCallback = null;
        this.threadId = 1;
        this.ws = null;
        this.config = null;
        try {
            this.config = require('./config.json');
        }
        catch (e) {
            console.info('config not found, continue with defaults');
        }
        this.port = (((this.config || {}).output || {}).grunt || {}).port || 49886;
    }

    _respondWithCallback (data) {
        if (this.messageCallback && data.thread_id === this.threadId - 1) {
            this.messageCallback.callback(data, this.messageCallback.done);
        }
    }

    _onOpen () {
        if (this.callback) {
            this.callback();
        }
    }

    _onClose () {
        if (this.stopCallback) {
            this.stopCallback();
        }
    }

    _onMessage (data) {
        this._respondWithCallback(JSON.parse(data));
    }

    sendMessage (message) {
        this.ws.send(JSON.stringify({
            content: message,
            thread_id: this.threadId++
        }));
    }

    receiveMessage (cb, done) {
        this.messageCallback = {
            callback: cb,
            done: done
        };
    }

    start (cb) {
        this.callback = cb;
        setTimeout(() => {
            this.ws = new WebSocket(`ws://localhost:${this.port}`);
            this.ws.on('open', this._onOpen.bind(this));
            this.ws.on('close', this._onClose.bind(this));
            this.ws.on('message', this._onMessage.bind(this));
        }, 5000); // give the socket a chance to start
    }

    shutdown (cb) {
        this.ws.send(JSON.stringify({
            content: '/shutdown'
        }));
        this.stopCallback = cb;
    }
}

module.exports = Client;
