let discord = require('discord.js'),
    request = require('request'),
    callback = null,
    api = null,
    bot = null,
    avatarB64 = null,

    lookUpChannel = function(threadId) {
        let channel = null;

        for (let key in bot.channels) {
            if (!(key && key.trim().length > 0 && !isNaN(key))) {
                continue;
            }
            channel = bot.channels[key];
            if (channel.id === threadId) {
                return channel;
            }
        }
        for (let pKey in bot.privateChannels) {
            if (!(pKey && pKey.trim().length > 0 && !isNaN(pKey))) {
                continue;
            }
            channel = bot.privateChannels[pKey];
            if (channel.id === threadId) {
                return channel;
            }
        }

        return channel;
    },

    getUsers = function() {
        let users = {},
            user;

        for (let key in bot.users) {
            if (!(key && key.trim().length > 0 && !isNaN(key))) {
                continue;
            }
            user = bot.users[key];
            users[user.id] = {
                name: user.username,
                id: user.id,
                tag: '@' + user.username + '#' + user.discriminator
            };
        }
        return users;
    },

    sentenceSplitter = function(message) {
        const charLimit = 2000;
        let spl = message.split('\n'),
            messages = [''],
            messagesIndex = 0;

        for (let i = 0; i < spl.length; i++) {
            while (spl[i].length > charLimit) {
                let numChars = charLimit - messages[messagesIndex].length;
                let chars = spl[i].substr(0, numChars);
                spl[i] = spl[i].substr(numChars);
                messages[messagesIndex] += chars;
                messagesIndex++;
                messages[messagesIndex] = '';
            }
            if (messages[messagesIndex].length + spl[i].length > charLimit) {
                messagesIndex++;
                messages[messagesIndex] = '';
                i--;
            }
            else {
                messages[messagesIndex] = messages[messagesIndex] + spl[i] + '\n';
            }
        }

        return messages;
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
            let index = message.indexOf(users[value].name);
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

    sendSingleMessage = function(message, threadId, channel, callback) {
        stopTyping(threadId);
        bot.sendMessage(channel, message, callback);
    },

    sendMultipleMessages = function(messageList, threadId, channel) {
        if (!messageList || messageList.length <= 0) {
            return;
        }
        let message = messageList[0];
        messageList.splice(0, 1);
        sendSingleMessage(message, threadId, channel, sendMultipleMessages.bind(this, messageList, threadId, channel));
    },

    sendMessage = function(message, threadId) {
        let channel = lookUpChannel(threadId);
        message = addMentions(message);
        message = sentenceSplitter(message);
        sendMultipleMessages(message, threadId, channel);
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

    recMessage = function(message) {
        let event = shim.createEvent(message.channel.id, message.author.id, message.author.username, removeMentions(message.cleanContent));
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
        });

        bot.on('message', function(message) {
            if (bot.user.id !== message.author.id) {
                recMessage(message);
            }
        });
    };

exports.start = function(cb) {
    let functions = {
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
