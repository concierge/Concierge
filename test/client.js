var io = require('socket.io-client')('http://localhost:49886'),
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
    io.emit('message', {
        content: message,
        thread_id: threadId++
    });
};

Client.prototype.receiveMessage = function(cb, done) {
    messageCallback = {
        callback: cb,
        done: done
    };
};

Client.prototype.shutdown = function(cb) {
    io.emit('message', {
        content: '/shutdown'
    });
    stopCallback = cb;
}

io.on('connect', function() {
    if (callback) {
        callback();
    }
});

io.on('disconnect', function() {
    if (stopCallback) {
        stopCallback();
    }
});

io.on('message', function(data) {
    data.__type = 'message';
    responsdWithCallback(data);
});

io.on('privateMessage', function(data) {
    data.__type = 'privateMessage';
    responsdWithCallback(data);
});

io.on('url', function(data) {
    data.__type = 'url';
    responsdWithCallback(data);
});

io.on('image', function(data) {
    data.__type = 'image';
    responsdWithCallback(data);
});

io.on('file', function(data) {
    data.__type = 'file';
    responsdWithCallback(data);
});

io.on('typing', function(data) {
    data.__type = 'typing';
    responsdWithCallback(data);
});

io.on('title', function(data) {
    data.__type = 'title';
    responsdWithCallback(data);
});

module.exports = Client;
