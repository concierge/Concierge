var config = require.once('../config.js'),

getHasPermission = function (config, userId, name, threadId, moduleName) {
    if (!config.modules || !config.modules[moduleName] || config.modules[moduleName].length === 0) {
        return true;
    }

    if (!config.users || Object.keys(config.users).length === 0) {
        return false;
    }

    var user = config.users[userId] || config.users[name];
    if (!user || !user[threadId] || user[threadId].length === 0) {
        return false;
    }

    var common = user[threadId].filter(function (p) {
        return config.modules[moduleName].indexOf(p) !== -1;
    });

    return common.length >= 1;
},

modify = function (name, threadId, action, method) {
    if (!exports.config.users) {
        exports.config.users = {};
    }

    if (!exports.config.users[name]) {
        exports.config.users[name] = {};
    }

    if (!exports.config.users[name][threadId]) {
        exports.config.users[name][threadId] = [];
    }

    switch (method) {
        case 'grant':
        {
            if (!exports.config.users[name][threadId].includes(action)) {
                console.log('grant');
                exports.config.users[name][threadId].push(action);
                return true;
            }
            console.log('nope');
            return false;
        }
        case 'revoke':
        {
            var newArr = exports.config.users[name][threadId].filter(function(item) {
                return item !== action;
            });
            if (newArr.length === exports.config.users[name][threadId].length) {
                return false;
            }
            exports.config.users[name][threadId] = newArr;
            return true;
        }
        default:
        {
            console.log('WTF: ' + method);
        }
    }
},

setup = function (action, name, permission) {
    if (!exports.config.modules) {
        exports.config.modules = {};
    }

    if (!exports.config.modules[name]) {
        exports.config.modules[name] = [];
    }

    switch (action) {
        case 'create':
            {
                if (!exports.config.modules[name].includes(permission)) {
                    exports.config.modules[name].push(permission);
                    return true;
                }
                return false;
            }
        case 'delete':
            {
                var newArr = exports.config.modules[name].filter(function (item) {
                    return item === action;
                });
                if (newArr.length === exports.config.modules[name].length) {
                    return false;
                }
                exports.config.modules[name] = newArr;
                return true;
            }
    }
},

matchHook = function (moduleName, origionalMatch, config) {
    return function (event, commandPrefix) {
        if (getHasPermission(config, event.sender_id, event.sender_name, event.thread_id, moduleName)) {
            return origionalMatch(event, commandPrefix);
        }
        console.log('no permission')
        return false;
    }
},

helpHook = function (moduleName, origionalHelp, config) {
    return function (commandPrefix) {
        if (getHasPermission(config, event.sender_id, event.sender_name, event.thread_id, moduleName)) {
            return origionalHelp.call(this, commandPrefix);
        }
        return false;
    }
};

exports.load = function () {
    exports.config = config.getConfig('admin');
    for (var i = 0; i < exports.platform.coreModules.length; i++) {
        var help = exports.platform.coreModules[i].help,
            match = exports.platform.coreModules[i].match;

        exports.platform.coreModules[i].help = helpHook(exports.platform.coreModules[i].name, help, exports.config);
        exports.platform.coreModules[i].match = matchHook(exports.platform.coreModules[i].name, match, exports.config);
    }
};

exports.match = function (event, commandPrefix) {
    return event.arguments[0] === commandPrefix + 'admin';
};

exports.help = function () {
    // Deliberately do not provide details on the usage of this, so users do not know of its existance.
    return [];
};

exports.run = function (api, event) {
    if (event.arguments.length !== 4) {
        api.sendMessage('Usage:\n' +
            '- admin <grant/revoke> <fullName/userId> <permissionName>\n' +
            '- admin <create/delete> <coreModuleName> <permissionName>\n' +
            'For spaces in any section, encapsulate with double quotes (").', event.thread_id);
        return false;
    }

    var action = (event.arguments[1] + '').trim().toLowerCase();
    var permission = (event.arguments[3] + '').trim().toLowerCase();

    if (action === 'create' || action === 'delete') {
        if (!setup(action, event.arguments[2], permission)) {
            api.sendMessage('Failed to set permissions. Please ensure permission has not already been ' + action + 'ed.', event.thread_id);
        }
        else {
            api.sendMessage('Complete.', event.thread_id);
        }
    }
    else if (action === 'grant' || action === 'revoke') {
        if (!modify(event.arguments[2], event.thread_id, permission, action)) {
            api.sendMessage('Failed to set permissions. Please ensure permission has not already been modified with ' + action + '.', event.thread_id);
        }
        else {
            api.sendMessage('Complete.', event.thread_id);
        }
    }
    else {
        api.sendMessage('Only grant, revoke, create and delete are avalible.', event.thread_id);
    }
    
    return false;
};