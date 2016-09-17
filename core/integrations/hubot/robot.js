var instance,
    messageCallback,
    api,
    threadUsers = {};

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
        },
        getUsers: function(thread) {
            return threadUsers[thread];
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
    users: function () {
        var res = [];
        for (var r in threadUsers) {
            for (var u in r) {
                res.push(threadUsers[r][u]);
            }
        }
        return res;
    },
    userForId: function (id, options) {
        let users = this.users();
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === id) {
                return users[i];
            }
        }

        if (options && options.room) {
            if (!threadUsers[options.room]) {
                threadUsers[options.room] = {};
            }
            var user = {
                name: options.name,
                id: id,
                email: options.email || 'unknown@unknown.unknown',
                room: options.room
            };
            threadUsers[options.room][id] = user;
            return user;
        }
        return null;
    },
    usersForRawFuzzyName: function (fuzzyName) {
        let users = this.users(),
            lower = fuzzyName.toLowerCase();
        for (let i = 0; i < users.length; i++) {
            if (!users[i].name.toLowerCase().startsWith(lower)) {
                users.splice(i, 1);
                i--;
            }
        }
        return users;
    },
    usersForFuzzyName: function (fuzzyName) {
        let rawFuzzyName = this.usersForRawFuzzyName(fuzzyName),
            lower = fuzzyName.toLowerCase();
        for (let i = 0; i < rawFuzzyName.length; i++) {
            if (rawFuzzyName[i].name.toLowerCase() === lower) {
                return [rawFuzzyName[i]];
            }
        }
        return rawFuzzyName;
    },
    userForName: function (fuzzyName) {
        let users = this.users(),
            lower = fuzzyName.toLowerCase();
        for (let i = 0; i < users.length; i++) {
            if (users[i].name.toLowerCase() === lower) {
                return users[i];
            }
        }
        return null;
    }
};

exports.shutdown = exports.platform.shutdown;

exports.name = 'Concierge';
