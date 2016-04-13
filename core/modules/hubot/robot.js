var Message = require.once('./message.js'),
    Responder = require.once('./responder.js');

var Robot = function(Instance, descriptor, config) {
    this.name = descriptor.name;
    this._help = descriptor.help;

    this.listeners = [];
    this.catchAllListeners = [];
    this.receiveMiddlewares = [];
    this.listenerMiddlewares = [];
    this.responseMiddlewares = [];

    this.brain = {
        on: function(event, callback) {
            if (event === 'loaded') {
                callback();
            }
        },
        emit: function() {},
        data: config
    };

    this.instance = new Instance(this);
};

Robot.prototype.run = function (api, event) {
    if (!event.__robotCallbackListeners) {
        return;
    }
    
    for (var i = 0; i < event.__robotCallbackListeners.length; i++) {
        var responder = new Responder(api, event, event.__robotCallbackListeners[i].match, event.__robotCallbackMessage);
        event.__robotCallbackListeners[i].callback(responder);
    }
};

Robot.prototype.match = function (event, commandPrefix) {
    var msg = new Message(event, commandPrefix);
    
    var hasMatched = false;
    for (var i = 0; i < this.listeners.length; i++) {
        var m = this.listeners[i].matcher(msg);
        if (m) {
            hasMatched = true;
            if (!event.__robotCallbackListeners) {
                event.__robotCallbackListeners = [];
                event.__robotCallbackMessage = msg;
            }
            event.__robotCallbackListeners.push({
                callback: this.listeners[i].callback,
                match: m
            });
        }
    }
    
    if (!hasMatched) {
        for (var i = 0; i < this.catchAllListeners.length; i++) {
            if (!event.__robotCallbackListeners) {
                event.__robotCallbackListeners = [];
                event.__robotCallbackMessage = msg;
            }
            this.catchAllListeners[i](msg);
        }
    }
    
    return !!event.__robotCallbackListeners;
};

Robot.prototype.listen = function (matcher, callback) {
    this.listeners.push({
        matcher: matcher,
        callback: callback
    });
};

Robot.prototype.hear = function (regex, callback) {
    this.listeners.push({
        matcher: function (msg) {
            return msg.event.body.match(regex);
        },
        callback: callback
    });
};

Robot.prototype.respond = function (regex, callback) {
    this.listeners.push({
        matcher: function (msg) {
            var prefix = msg.prefix.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            var reg = eval('/^' + prefix + regex.toString().substring(1));
            return msg.event.body.match(reg);
        },
        callback: callback
    });
};

Robot.prototype.catchAll = function (callback) {
    this.listeners.push(callback);
};

Robot.prototype.receiveMiddleware = function (middleware) {
    this.receiveMiddlewares.push(middleware);
};

Robot.prototype.listenerMiddleware = function (middleware) {
    this.listenerMiddlewares.push(middleware);
};

Robot.prototype.responseMiddleware = function (middleware) {
    this.responseMiddlewares.push(middleware);
};

Robot.prototype.help = function (commandPrefix) {
    var h = [];
    for (var i = 0; i < this._help.length; i++) {
        var l = [];
        for (var j = 0; j < this._help[i].length; j++) {
            l.push(this._help[i][j].replace(/{{commandPrefix}}/g, commandPrefix));
        }
        h.push(l);
    }
    return h;
};

Robot.prototype.logger = {
    error: console.error,
    warning: console.warn,
    info: console.info
};

module.exports = Robot;