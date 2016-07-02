var bot = null,
    api = null,
    shim = require('../shim.js'),
    TelegramBot = require.safe('node-telegram-bot-api');


var messagePadder = function(str, length) {
    var padding = ( new Array( Math.max( length - str.length + 1, 0 ) ) ).join( ' ' );
    return str + padding;
};

var messageSplitter = function(message) {
    var chunks = message.match(/[^]{1,4096}/g);
    // This is kinda' crazy too. Basically, Telegram delivers smaller length
    // messages first, thus it helps to keep them the same length
    for (var i = 0; i < chunks.length; i++) {
        if (chunks[i].length < 4096) {
            var pad_needed = 4096 - chunks[i].length;
            var padding = messagePadder(chunks[i], pad_needed);
            chunks[i] += padding;
        }
    }
    return chunks;
};

var sendMessage = function(message, thread, callback) {
    bot.sendMessage(thread, message);
    if (callback) {
        // Need to use this silliness because Telegram delivers
        // messages out of order. Maybe look at async?
        setTimeout(callback(), 1000);
    }
};

var prepMessage = function(list, thread) {
    if (!list || list.length <= 0) {
        return;
    }
    var message = list[0];
    list.splice(0, 1);
    sendMessage(message, thread, prepMessage(list, thread));
};


exports.start = function(callback) {
    var token = exports.config.token;
    bot = new TelegramBot(token, {
        polling: true
    });

    api = shim.createPlatformModule({
        sendMessage: function(message, thread) {
            var parts = messageSplitter(message);
            prepMessage(parts, thread);
        },
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
