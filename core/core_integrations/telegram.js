var bot = null,
    api = null,
    TelegramBot = require.safe('node-telegram-bot-api');

var sendMessage = function(message, thread, opts) {
    bot.sendMessage(thread, message, opts);
};

exports.getApi = function() {
    return api;
};

exports.start = function(callback) {
    var token = exports.config.token;
    bot = new TelegramBot(token, {
        polling: true
    });

    api = shim.createIntegration({
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
    console.debug('Telegram -> start shutdown');
    // Ensure that there's no endless loop because of an incorrect offset value
    exports.config.offset = bot._polling.offset + 1;
    // No stopPolling() method, so we set the abort to true & that seems to work
    if (bot._polling) {
        bot._polling.abort = true;
    }
    this._polling = null;
};
