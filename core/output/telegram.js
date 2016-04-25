var TelegramBot = require.safe('node-telegram-bot-api'),
    bot = null,
    shim = require('../shim.js'),
    api = null;

// This are the methods available from Kassy:
// sendMessage(message, thread)
// sendPrivateMessage(message, thread, senderId)
// sendUrl(url, thread) 
// sendImage(type, image, description, thread)
// sendFile(type, file, description, thread)
// sendTyping(thread)
// setTitle(title, thread)
// commandPrefix

sendMessage = function(message, thread) {
    // TODO Explore how to send Telegram-specific options
    var opts;
    bot.sendMessage(thread, message, opts);
};

sendUrl = function(url, thread)  {
    // TODO
};

sendFile = function(type, file, description, thread) {
    // TODO
};

sendTyping = function(thread) {
    // TODO
};


exports.start = function(callback) {
    var token = exports.config.token;
    bot = new TelegramBot(token, {
        polling: true
    });
    api = shim.createPlatformModule({
        sendMessage: sendMessage,
        sendPrivateMessage: sendMessage,
        sendFile: sendFile,
        sendTyping: sendTyping,
        commandPrefix: exports.config.commandPrefix
    });

    bot.on('message', function(msg) {
        var event = shim.createEvent(msg.chat.id, msg.from.id, msg.from.username, msg.text);
        callback(api, event);
    });
};

exports.stop = function() {
    console.debug("Telegram -> start shutdown");
    bot = null;
    api = null;
};
