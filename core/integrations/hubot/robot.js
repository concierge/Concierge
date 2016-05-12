var instance,
    messageCallback,
    shim = require.once('../../shim.js');

exports.logger = {
    error: console.error,
    warning: console.warn,
    info: console.info,
    debug: console.debug
};

exports.receive = function (message) {
    var msg = shim.createEvent(message.room, message.user.name, message.user.id, message.text);

    var api = shim.createPlatformModule({
        commandPrefix: exports.config.commandPrefix ? exports.config.commandPrefix : '/',
        sendMessage: function(message, thread) {
            var m = {
                room: thread
            };
            instance.send(m, message);
        }
    });

    messageCallback(api, msg);
};

exports.start = function (callback) {
    messageCallback = callback;
    instance.run();
};

exports.stop = function () {
    instance.close();
};

exports.use = function (inst) {
    instance = inst.use(exports);
    return exports;
};

exports.brain = {
    data: exports.config,
    userForId: function() {
        return {
            id: 'foo',
            name: 'bar'
        };
    }
};

exports.shutdown = function () {
    exports.logger.warning("Integrations should not invoke a safe shutdown. Please use the shutdown command itself.");
    exports.platform.shutdown();
};

exports.name = 'Kassy';
