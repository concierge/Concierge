let discord = require('discord.js'),
    request = require('request'),
    callback = null,
    api = null,
    bot = null,
    avatarB64 = null,

    lookUpChannel = (threadId) => {
        let channel = bot.channels.find(val => val.id === threadId);
        if (channel) {
            return channel;
        }

        return null;
    },

    getUsers = () => {
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

    sendTyping = (threadId) => {
        let channel = lookUpChannel(threadId);
        channel.startTyping();
    },

    addMentions = (message) => {
        let users = getUsers();
        for (let value in users) {
            let index = message.indexOf(users[value].name);
            if (index > 0) {
                message = message.substr(0, index) + '<@' + users[value].id + '>' + message.substr(index + users[value].name.length);
            }
        }
        return message;
    },

    removeMentions = (message) => {
        let users = getUsers();
        for (let value in users) {
            let index = message.indexOf(users[value].tag);
            if (index > 0) {
                message = message.substr(0, index) + users[value].name + message.substr(index + users[value].tag.length);
            }
        }
        return message;
    },

    sendMessage = (message, threadId) => {
        let channel = lookUpChannel(threadId);
        message = addMentions(message);
        let messages = shim._chunkMessage(message, 2000);
        for (let message of messages) {
            channel.stopTyping();
            channel.sendMessage(message);
        }
    },

    sendFile = (type, file, description, threadId) => {
        let channel = lookUpChannel(threadId);
        channel.stopTyping();
        if (type) {
            channel.sendFile(file, '', description);
        }
        else {
            channel.sendMessage(description);
            channel.sendMessage($$`I also have something to send you but cant seem to do so...`);
        }
    },

    sendUrl = (url, threadId) => {
        let channel = lookUpChannel(threadId);
        channel.stopTyping();
        channel.sendFile(url);
    },

    setTitle = (title, threadId) => {
        let channel = lookUpChannel(threadId);
        channel.setName(title);
    },

    recMessage = (message) => {
        let event = shim.createEvent(message.channel.id, message.author.id, message.author.username, removeMentions(message.cleanContent));
        callback(api, event);
    },

    initialiseBot = (token) => {
        bot = new discord.Client( {
            auto_reconnect: true,
            fetch_all_members: true
        });

        bot.on('ready', () => {
            if (bot.user.avatar !== avatarB64) {
                bot.user.setAvatar(avatarB64);
            }
            if (exports.config.name) {
                bot.user.setUsername(exports.config.name);
            }
            console.debug($$`Discord is ready`);
        });

        bot.on('message', (message) => {
            if (bot.user.id !== message.author.id) {
                recMessage(message);
            }
        });

        bot.login(token);
    };

exports.start = (cb) => {
    let functions = {
            sendMessage: sendMessage,
            sendFile: sendFile,
            sendTyping: sendTyping,
            sendUrl: sendUrl,
            sendImage: sendFile,
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
            (error, response, body) => {
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

exports.getApi = () => {
    return api;
};

exports.stop = () => {
    if (bot !== null) {
        bot.destroy();
    }
    callback = null;
};
