var fs = require('fs'),
    WebSocket = require('ws'),
    callback = null,
    stopCallback = null,
    messageCallback = null,
    threadId = 1,
    ws = null,

responsdWithCallback = function(data) {
    if (messageCallback && data.thread_id === threadId - 1) {
        messageCallback.callback(data, messageCallback.done);
    }
},

Client = function(cb) {
    var config = JSON.parse(fs.readFileSync('config.json', 'utf8')),
        port = config.output.grunt.port || 49886;

    callback = cb;
    ws = new WebSocket('ws://localhost:' + port);

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

module.exports = Client;
