const fs = require('fs'),
    restify = require('restify'),
    skype = require('skype-sdk');

let callback = null,
    server = null;

exports.start = function(cb) {
    callback = cb;
    const botService = new skype.BotService({
        messaging: {
            botId: '28:<bot’s id="Concierge">',
            serverUrl : 'https://apis.skype.com',
            requestTimeout : 15000,
            appId: 'def78734-0ded-4d81-a401-765a8577e0e4',
            appSecret: '8E3934132BAF06F5620DC5A72CBC2A227F9E4AD2'
        }
    });

    botService.on('contactAdded', (bot, data) => {
        bot.reply(`Hello ${data.fromDisplayName}!`, true);
    });

    botService.on('personalMessage', (bot, data) => {
        console.log(bot);
        console.log(data);
        bot.reply(`Hey ${data.from}. Thank you for your message: "${data.content}".`, true);
    });

    const server = restify.createServer();
    server.post('/v1/chat', skype.messagingHandler(botService));
    const port = process.env.PORT || 4037;
    server.listen(port);
    console.log('Listening for incoming requests on port ' + port);
};

exports.stop = function() {
    if (server !== null) {
        server.close();
    }
};
