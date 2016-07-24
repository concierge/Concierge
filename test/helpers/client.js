var fs = require('fs'),
    WebSocket = require('ws'),
    callback = null,
    stopCallback = null,
    messageCallback = null,
    threadId = 1,
    ws = null,
    config = null,
    port = 49886,

    responsdWithCallback = function(data) {
        if (messageCallback && data.thread_id === threadId - 1) {
            messageCallback.callback(data, messageCallback.done);
        }
    },

    Client = function(cb) {
        callback = cb;

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

try {
    var file = fs.readFileSync('config.json', 'utf8');
    config = JSON.parse(file);
}
catch (e) {
    console.info('config not found, continue with defaults');
}

if (config !== null && config.output.grunt && config.output.grunt.port) {
    port = config.output.grunt.port;
}

ws = new WebSocket('ws://localhost:' + port);

module.exports = Client;
