var WebSocketServer = require.once('ws').Server,
    wss = null,
    functions = null,
    api = null,
    callback = null,
    socket = null,

    sendMessage = function(message, thread) {
        socket.send(JSON.stringify({
            __type: 'message',
            content: message,
            thread_id: thread
        }));
    },

    sendPrivateMessage = function(message, thread, senderId) {
        socket.send(JSON.stringify({
            __type: 'privateMessage',
            content: message,
            thread_id: thread,
            sender_id: senderId
        }));
    },

    sendUrl = function(url, thread) {
        socket.send(JSON.stringify({
            __type: 'url',
            content: url,
            thread_id: thread
        }));
    },

    sendImage = function(type, image, description, thread) {
        socket.send(JSON.stringify({
            __type: 'privateMessage',
            type: type,
            content: image,
            thread_id: thread,
            description: description
        }));
    },

    sendFile = function(type, file, description, thread) {
        socket.send(JSON.stringify({
            __type: 'privateMessage',
            type: type,
            content: file,
            thread_id: thread,
            description: description
        }));
    },

    sendTyping = function(thread) {
        socket.send(JSON.stringify({
            __type: 'typing',
            thread_id: thread
        }));
    },

    setTitle = function(title, thread) {
        socket.send(JSON.stringify({
            __type: 'title',
            content: title,
            thread_id: thread
        }));
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

exports.getApi = function() {
    return api;
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
    api = shim.createIntegration(functions);

    wss = new WebSocketServer({ port: exports.config.port || 49886 });

    wss.on('connection', function(s) {
        console.debug('connection received');
        if (socket !== null) {
            throw 'existing connection already established';
        }
        socket = s;

        socket.on('message', function(data) {
            data = JSON.parse(data);
            console.debug('received message: ' + data);
            recMessage(data);
        });

        socket.on('error', function(error) {
            console.error(error);
        });

        socket.on('close', function() {
            console.debug('Client disconnected');
        });
    });

    wss.on('error', function(error) {
        console.error(error);
    });
};

exports.stop = function() {
    if (socket) {
        socket.terminate();
    }
    wss.close();
};
