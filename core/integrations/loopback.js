var messageCallback = null,
    maxLoopbackCount = 5;

exports.getApi = function() {
    return null;
};

exports.start = function (callback) {
    if (messageCallback) {
        throw "Cannot start when already started.";
    }
    messageCallback = callback;
};

exports.stop = function () {
    if (!messageCallback) {
        throw "Cannot stop when not already started.";
    }
    messageCallback = null;
};

exports.createLoopbackWrapper = function (func, platform) {
    return function (msg, thread) {
        var event = exports.createEvent(thread, 'senderId', 'name', msg + '');
        if (event.loopback_count < maxLoopbackCount) {
            messageCallback(platform, event);
        }
        func.call(this, msg, thread);
    };
};
