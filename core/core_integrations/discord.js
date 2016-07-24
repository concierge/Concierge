var shim = require.once('../shim.js'),
    discord = require('discord.js'),
    request = require('request'),
    callback = null,
    api = null,
    bot = null,
    avatarB64 = null,

    sendMessage = function(message, thread) {
        stopTyping(thread);
        bot.sendMessage(thread, message);
    },

    sendFile = function(type, file, description, thread) {
        stopTyping(thread);
        bot.sendFile(thread, file, description);
    },

    sendTyping = function(thread) {
        bot.startTyping(thread);
    },

    stopTyping = function(thread) {
        bot.stopTyping(thread);
    },

    setTitle = function(title, thread) {
        bot.setChannelName(thread, title);
    },

    getUsers = function() {
        return bot.users;
    },

    recMessage = function(data) {
        var event = shim.createEvent(data.channel, data.author.id, data.author.username, data.cleanContent);
        callback(api, event);
    },

    initialiseBot = function(token) {
        bot = new discord.Client( {
            autoReconnect: true
        });

        bot.loginWithToken(token, function() {
            if (bot.avatar !== avatarB64) {
                bot.setAvatar(avatarB64);
            }
        });

        bot.on('message', function(message) {
            recMessage(message);
        });
    };

exports.start = function(cb) {
    var functions = {
        sendMessage: sendMessage,
        sendFile: sendFile,
        sendTyping: sendTyping,
        setTitle: setTitle,
        getUsers: getUsers,
        commandPrefix: exports.config.commandPrefix
    },
        token = null;

    callback = cb;
    api = shim.createIntegration(functions);

    if (!exports.config.token) {
        console.error('A token must be provided');
        return;
    }

    token = exports.config.token;

    if (exports.config.avatarUrl) {
        request(exports.config.avatarUrl,
            function(error, response, body) {
                if (!error && response.statusCode === 200) {
                    var data = 'data:' +
                        response.headers['content-type'] +
                        ';base64,' +
                        new Buffer(body).toString('base64');
                    initialiseBot(token);
                }
            });
    }
    else {
        initialiseBot(token);
    }
};

exports.getApi = function() {
    return api;
};

exports.stop = function() {
    stopTyping(thread);
    if (bot != null) {
        bot.destroy();
    }
};
