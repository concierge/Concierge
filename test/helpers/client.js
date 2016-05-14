var fs = require('fs'),
    WebSocket = require('ws'),
    config = null,
    callback = null,
    stopCallback = null,
    messageCallback = null,
    threadId = 1,

responsdWithCallback = function(data) {
    if (messageCallback && data.thread_id === threadId - 1) {
        messageCallback.callback(data, messageCallback.done);
    }
},

Client = function(cb) {
    callback = cb;
};

Client.prototype.sendMessage = function(message) {
    ws.send(JSON.stringify({
        content: message,
        thread_id: threadId++
    }));
};

Client.prototype.receiveMessage = function(cb, done) {
    messageCallback = {
        callback: cb,
        done: done
    };
};

Client.prototype.shutdown = function(cb) {
    ws.send(JSON.stringify({
        content: '/shutdown'
    }));
    stopCallback = cb;
};

config = JSON.parse(fs.readFileSync('config.json', 'utf8')),
ws = new WebSocket(`ws://localhost:${ config.output.grunt.port || 49886 }`),

ws.on('open', function() {
    if (callback) {
        callback();
    }
});

ws.on('close', function() {
    if (stopCallback) {
        stopCallback();
    }
});

ws.on('message', function(data) {
    responsdWithCallback(JSON.parse(data));
});

module.exports = Client;
