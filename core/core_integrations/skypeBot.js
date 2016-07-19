var fs = require('fs'),
    restify = require('restify'),
    skype = require('skype-sdk'),
    shim = require.once('../shim.js'),
    callback = null,
    server = null,
    botService = null,
    api = null,

    sendMessage = function(message, thread) {
        console.log(message);
        botService.send(thread, message, true);
    },

    sendFile = function(type, image, description, thread) {
        console.log("sending attachment");
        // Assumes the file type is always image, (only Image and Video supported atm)
        botService.sendAttachment(thread, description, 'Image', image);
    },

    receiveMessage = function(bot, data) {
        console.log(bot);
        console.log(data);

        var event = null,
            message = {
                thread_id: data.from,
                sender_id: data.from,
                sender_name: data.from,
                content: data.content
            };

        event = shim.createEvent(message.thread_id, message.sender_id, message.sender_name, message.content);
        callback(api, event);
    };

exports.start = function(cb) {
    var config = exports.config;
    callback = cb;
    botService = new skype.BotService({
        messaging: {
            botId: '28:<bot’s id="' + config.name + '">',
            serverUrl : 'https://apis.skype.com',
            requestTimeout : 15000,
            appId: config.app_id,
            appSecret: config.app_secret_password
        }
    });

    botService.on('groupMessage', function(bot, data) {
        data.from = data.to;
        receiveMessage(bot, data);
    });

    botService.on('personalMessage', function(bot, data) {
        receiveMessage(bot, data);
    });

    // server = restify.createServer({
    //     certificate: fs.readFileSync(config.cert),
    //     key: fs.readFileSync(config.key),
    //     httpsServerOptions: {
    //         ca: fs.readFileSync(config.ca)
    //     }
    // });

    server = restify.createServer();

    api = shim.createPlatformModule({
		sendMessage: sendMessage,
		sendFile: sendFile,
		commandPrefix: config.commandPrefix
    });

    server.post('/v1/chat', skype.messagingHandler(botService));
    server.use(skype.ensureHttps(true));
    server.use(skype.verifySkypeCert());
    const port = config.port || 8000;
    server.listen(port);
    console.debug('SkypeBot -> Listening for incoming requests on port ' + port);
};

exports.stop = function() {
    if (server !== null) {
        server.close();
    }
};
