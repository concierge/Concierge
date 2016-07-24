var instance,
    messageCallback,
    api;

exports.logger = {
    error: console.error,
    warning: console.warn,
    info: console.info,
    debug: console.debug
};

exports.receive = function (message) {
    const msg = global.shim.createEvent(message.room, message.user.name, message.user.id, message.text);
    messageCallback(api, msg);
};

exports.getApi = function() {
    return api;
};

exports.start = function (callback) {
    messageCallback = callback;
    api = global.shim.createIntegration({
        commandPrefix: exports.config.commandPrefix ? exports.config.commandPrefix : '/',
        sendMessage: function (message, thread) {
            const m = {
                room: thread
            };
            instance.send(m, message);
        }
    });
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
    exports.platform.shutdown();
};

exports.name = 'Concierge';
