let fs = require('fs'),
    restify = require('restify'),
    builder = require('botbuilder'),
    mime = require('mime'),
    callback = null,
    server = null,
    botService = null,
    api = null,
    bot = {},
    userCache = {},

    buildAddress = (threadId) => {
        let contents = threadId.split('\0');
        return {bot: bot[contents[1]], conversation: {id: contents[0]}, serviceUrl: 'https://' + contents[1] + '.botframework.com', useAuth: true};
    },

    sendMessage = (message, threadId) => {
        let address = buildAddress(threadId),
            botMessage = new builder.Message();

        botMessage.address(address);
        botMessage.text(message);
        botMessage.textFormat('plain');
        botMessage.textLocale($$.getLocale());
        botService.send(botMessage);
    },

    sendImage = (type, image, description, threadId) => {
        switch (type) {
        case 'file':
            api.sendFile(type, image, description, threadId);
            break;
        case 'url' :
            let address = buildAddress(threadId),
                message = new builder.Message();

            message.address(address);
            message.addAttachment({
                content: image,
                contentType: mime.lookup(image),
                contentUrl: image
            });
            message.text(description);
            botService.send(message);
            break;
        default: // fallback to sending a message
            sendMessage(description, threadId);
            sendMessage($$`I also have something to send you but cant seem to do so...`, threadId);
            break;
        }
    },

    sendUrl = (url, threadId) => {
        let address = buildAddress(threadId),
            message = new builder.Message();
        message.address(address);
        message.text(url);
        botService.send(message);
    },

    sendTyping = (threadId) => {
        let address = buildAddress(threadId),
            message = {type: 'typing', address: address, textLocale: $$.getLocale()};

        botService.send(message);
    },

    getUsers = () => {
        return userCache;
    },

    receiveMessage = (session) => {
        if (!bot[session.message.source]) {
            bot[session.message.source] = session.message.address.bot;
        }

        if (!userCache[session.message.address.user.id]) {
            userCache[session.message.address.user.id] = session.message.address.user.name;
        }

        let message = session.message.text.replace(/<[^"]+"([^"]+)[^\/]+\/at>/g, (match, p1, offset) => {
            if (p1 === bot[session.message.source].id && offset === 0) {
                return '';
            }
            if (userCache[p1]) {
                return userCache[p1];
            }
            return match;
        });
        let event = shim.createEvent(session.message.address.conversation.id + '\0' + session.message.source, session.message.user.id, session.message.user.name,  message);
        callback(api, event);
    };

exports.getApi = () => {
    return api;
};

exports.start = (cb) => {
    let config = exports.config;
    callback = cb;
    if (config.cert && config.key) {
        server = restify.createServer({
            certificate: fs.readFileSync(config.cert),
            key: fs.readFileSync(config.key)
        });
    }
    else {
        server = restify.createServer();
    }

    const port = config.port || 8000;
    server.listen(port, () => {
        console.debug(`${server.name} listening to ${server.url}`);
    });

    let connector = new builder.ChatConnector({ appId: config.app_id, appPassword: config.app_secret_password });
    botService = new builder.UniversalBot(connector);

    api = shim.createIntegration({
        sendMessage: sendMessage,
        sendTyping: sendTyping,
        sendImage: sendImage,
        commandPrefix: config.commandPrefix,
        sendUrl: sendUrl,
        getUsers: getUsers
    });

    server.post('/api/messages', connector.listen());

    let intents = new builder.IntentDialog();
    botService.dialog('/', intents);

    intents.onDefault([
        (session) => {
            receiveMessage(session);
        }
    ]);
};

exports.stop = () => {
    if (server !== null) {
        server.close();
    }
};
