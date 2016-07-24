var discord = require('discord.js'),
    request = require('request'),
    callback = null,
    api = null,
    bot = null,
    avatarB64 = null,

    lookUpChannel = function(threadId) {
        let channel = null;

        for (var key in bot.channels) {
            if (!(key && key.trim().length > 0 && !isNaN(key))) {
                continue;
            }
            channel = bot.channels[key];
            if (channel.id === threadId) {
                return channel;
            }
        }
        for (var key in bot.privateChannels) {
            if (!(key && key.trim().length > 0 && !isNaN(key))) {
                continue;
            }
            channel = bot.privateChannels[key];
            if (channel.id === threadId) {
                return channel;
            }
        }

        return channel;
    },

    sendTyping = function(threadId) {
        let channel = lookUpChannel(threadId);
        bot.startTyping(channel);
    },

    stopTyping = function(threadId) {
        let channel = lookUpChannel(threadId);
        bot.stopTyping(channel);
    },

    addMentions = function (message) {
        let users = getUsers();
        for (let value in users) {
            var index = message.indexOf(users[value].name);
            if (index > 0) {
                message = message.substr(0, index) + '<@' + users[value].id + '>' + message.substr(index + users[value].name.length);
            }
        }
        return message;
    },

    removeMentions = function(message) {
        let users = getUsers();
        for (let value in users) {
            let index = message.indexOf(users[value].tag);
            if (index > 0) {
                message = message.substr(0, index) + users[value].name + message.substr(index + users[value].tag.length);
            }
        }
        return message;
    },

    sendMessage = function(message, threadId) {
        let channel = lookUpChannel(threadId);
        message = addMentions(message);
        stopTyping(threadId);
        bot.sendMessage(channel, message);
    },

    sendFile = function(type, file, description, threadId) {
        let channel = lookUpChannel(threadId);
        stopTyping(threadId);
        bot.sendFile(channel, file, description);
    },

    setTitle = function(title, threadId) {
        let channel = lookUpChannel(threadId);
        bot.setChannelName(channel, title);
    },

    getUsers = function(threadId) {
        var users = {},
            user;

        for (var key in bot.users) {
            if (!(key && key.trim().length > 0 && !isNaN(key))) {
                continue;
            }
            user = bot.users[key];
            users[user.id] = {
                name: user.username,
                id: user.id,
                tag: '@' + user.username + '#' + user.discriminator
            }
        }
        return users;
    },

    recMessage = function(message) {
        var event = shim.createEvent(message.channel.id, message.author.id, message.author.username, removeMentions(message.cleanContent));
        callback(api, event);
    },

    initialiseBot = function(token) {
        bot = new discord.Client( {
            autoReconnect: true,
            forceFetchUsers: true
        });

        bot.loginWithToken(token);

        bot.on('ready', function() {
            if (bot.avatar !== avatarB64) {
                bot.setAvatar(avatarB64);
            }
            if (exports.config.name) {
                bot.setUsername(exports.config.name);
            }
            console.debug($$`Discord is ready`);
        })

        bot.on('message', function(message) {
            if (bot.user.id !== message.author.id) {
                recMessage(message);
            }
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
        console.error($$`A token must be provided`);
        return;
    }

    token = exports.config.token;

    if (exports.config.avatarUrl) {
        request(exports.config.avatarUrl,
            function(error, response, body) {
                if (!error && response.statusCode === 200) {
                    avatarB64 = 'data:' +
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
    if (bot !== null) {
        bot.destroy();
    }
    callback = null;
};
