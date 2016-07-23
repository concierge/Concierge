var fs = require('fs'),
    restify = require('restify'),
    builder = require('botbuilder'),
    callback = null,
    server = null,
    botService = null,
    api = null,

    sendMessage = function(message, thread) {
        console.log(thread.message);
        // console.log(message);
        // console.log(session.send.toString());
        thread.send(message);
    },

    sendFile = function(type, image, description, thread) {
        console.log("sending attachment");
        // Assumes the file type is always image, (only Image and Video supported atm)
        botService.sendAttachment(thread, description, 'Image', image);
    },

    receiveMessage = function(session) {
        var event = null,
            message = {
                thread_id: session,
                sender_id: session.message.user,
                sender_name: session.message.fromDisplayName,
                content: session.message.content
            };

        event = shim.createEvent(message.thread_id, message.sender_id, message.sender_name, message.content);
        callback(api, event);
    };

exports.getApi = function() {
    return api;
};

exports.start = function(cb) {
    var config = exports.config;
    callback = cb;
    var connector = new builder.ChatConnector({ appId: config.app_id, appPassword: config.app_secret_password });
    botService = new builder.UniversalBot(connector);
    // botService = new skype.BotService({
    //     messaging: {
    //         botId: '28:<bot’s id="' + config.name + '">',
    //         serverUrl : 'https://apis.skype.com',
    //         requestTimeout : 15000,
    //         appId: config.app_id,
    //         appSecret: config.app_secret_password
    //     }
    // });

    botService.dialog('/', [
        function(session) {
            receiveMessage(session);
        }
    ]);

    server = restify.createServer({
        certificate: fs.readFileSync(config.cert),
        key: fs.readFileSync(config.key)
        // httpsServerOptions: {
        //     ca: fs.readFileSync(config.ca)
        // }
    });

    // server = restify.createServer();

    api = shim.createIntegration({
		sendMessage: sendMessage,
		sendFile: sendFile,
		commandPrefix: config.commandPrefix
    });

    server.post('/api/messages', connector.listen());
    const port = config.port || 8000;
    server.listen(port, function() {
        console.debug('%s listening to %s', server.name, server.url);
    });

    botService.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));
};

exports.stop = function() {
    if (server !== null) {
        server.close();
    }
};
