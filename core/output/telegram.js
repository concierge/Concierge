var options = {
    // Used by the monkey patch to node-telegram-bot-api
    stopPolling: true
};
var TelegramBot = require.safe('node-telegram-bot-api');
// Adds the missing stopPolling() method
// https://github.com/yagop/node-telegram-bot-api/pull/51#issuecomment-217395990
require.safe('monkey-patches-node-telegram-bot-api')(TelegramBot,options);

var bot = null,
    shim = require('../shim.js'),
    api = null;

sendMessage = function(message, thread, opts) {
    bot.sendMessage(thread, message, opts);
};

exports.start = function(callback) {
    var token = exports.config.token;
    bot = new TelegramBot(token, {
        polling: true
    });

    api = shim.createPlatformModule({
        sendMessage: sendMessage,
        commandPrefix: exports.config.commandPrefix
    });

    bot.on('message', function(msg) {
        if (bot._polling.offset < exports.config.offset) {
            // Fixes issue where a duplicate message is received after restart
            return;
        }
        var event = shim.createEvent(msg.chat.id, msg.from.id, msg.from.username, msg.text);
        callback(api, event);
    });
};

exports.stop = function() {
    console.debug("Telegram -> start shutdown");
    exports.config.offset = bot._polling.offset+1;
    bot.stopPolling();
};
