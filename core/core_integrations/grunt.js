var shim = require.once('../shim.js'),
    Server = require.once('http'),
    server = Server.createServer(),
    io = require.once('socket.io')(server),
    port = 49886,
    functions = null,
    api = null,
    callback = null,
    socket = null,

    sendMessage = function(message, thread) {
        socket.emit('message', {
            content: message,
            thread_id: thread
        });
    },

    sendPrivateMessage = function(message, thread, senderId) {
        socket.broadcast.emit('privateMessage', {
            content: message,
            thread_id: thread,
            sender_id: senderId
        });
    },

    sendUrl = function(url, thread) {
        socket.broadcast.emit('url', {
            content: url,
            thread_id: thread
        });
    },

    sendImage = function(type, image, description, thread) {
        socket.broadcast.emit('image', {
            type: type,
            content: image,
            thread_id: thread,
            description: description
        });
    },

    sendFile = function(type, file, description, thread) {
        socket.broadcast.emit('file', {
            type: type,
            content: file,
            thread_id: thread,
            description: description
        });
    },

    sendTyping = function(thread) {
        socket.broadcast.emit('typing', {
            thread_id: thread
        });
    },

    setTitle = function(title, thread) {
        socket.broadcast.emit('title', {
            content: title,
            thread_id: thread
        });
    },

    recMessage = function(data) {
        var event = null;

        if (data) {
            if (!data.thread_id) {
                data.thread_id = '-1';
            }
            if (!data.sender_id) {
                data.sender_id = '123456789';
            }
            if (!data.sender_name) {
                data.sender_name = 'test user';
            }
            if (!data.content) {
                data.content = '';
            }

            event = shim.createEvent(data.thread_id, data.sender_id, data.sender_name, data.content);
            callback(api, event);
        }
        else {
            console.error('Received messsage with no content');
        }
    };

exports.start = function(cb) {
    callback = cb;
    functions = {
        sendMessage: sendMessage,
        sendPrivateMessage: sendPrivateMessage,
        sendUrl: sendUrl,
        sendImage: sendImage,
        sendFile: sendFile,
        sendTyping: sendTyping,
        setTitle: setTitle,
        commadPrefix: '/'
    };
    api = shim.createPlatformModule(functions);

    server.listen(port);
};

exports.stop = function() {
    io.close();
    server.close();
};

io.on('connection', function(s) {
    console.debug('connection received');
    if (socket !== null) {
        throw 'existing connection already established';
    }
    socket = s;

    socket.on('message', function(data) {
        console.debug('received message: ' + data);
        recMessage(data);
    });

    socket.on('error', function(error) {
        console.error(error);
    });

    socket.on('disconnect', function() {
        console.debug('disconnected');
    });
});
