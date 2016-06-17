﻿var cfg = null,

    getHasPermission = function (config, userId, name, threadId, moduleName) {
        if (!config.modules || !config.modules[moduleName] || config.modules[moduleName].length === 0) {
            return true;
        }

        if (!config.users || Object.keys(config.users).length === 0) {
            return false;
        }

        var user = config.users[userId] || config.users[name];
        if (!user) {
            return false;
        }

        var tId = null;
        for (var thread in user) {
            var test = new RegExp(thread);
            if (test.test(threadId)) {
                tId = thread;
                break;
            }
        }
        if (!tId || user[tId].length === 0) {
            return false;
        }

        var common = user[tId].filter(function (p) {
            return config.modules[moduleName].indexOf(p) !== -1;
        });

        return common.length >= 1;
    },

    modify = function (name, threadId, action, method) {
        if (!cfg.users) {
            cfg.users = {};
        }

        if (!cfg.users[name]) {
            cfg.users[name] = {};
        }

        if (!cfg.users[name][threadId]) {
            cfg.users[name][threadId] = [];
        }

        switch (method) {
            case 'grant': {
                if (!cfg.users[name][threadId].includes(action)) {
                    cfg.users[name][threadId].push(action);
                    return true;
                }
                return false;
            }
            case 'revoke': {
                var newArr = cfg.users[name][threadId].filter(function(item) {
                    return item !== action;
                });
                if (newArr.length === cfg.users[name][threadId].length) {
                    return false;
                }
                cfg.users[name][threadId] = newArr;
                return true;
            }
        }
    },

    setup = function (action, name, permission) {
        if (!cfg.modules) {
            cfg.modules = {};
        }

        if (!cfg.modules[name]) {
            cfg.modules[name] = [];
        }

        switch (action) {
        case 'create': {
            if (!cfg.modules[name].includes(permission)) {
                cfg.modules[name].push(permission);
                return true;
            }
            return false;
        }
        case 'delete': {
            var newArr = cfg.modules[name].filter(function (item) {
                return item === action;
            });
            if (newArr.length === cfg.modules[name].length) {
                return false;
            }
            cfg.modules[name] = newArr;
            return true;
        }
        }
    },

    matchHook = function (moduleName, origionalMatch, config) {
        return function(event, commandPrefix) {
            if (getHasPermission(config, event.sender_id, event.sender_name, event.thread_id, moduleName)) {
                return origionalMatch.call(this, event, commandPrefix);
            }
            return false;
        };
    },

    helpHook = function (moduleName, origionalHelp, config) {
        return function(commandPrefix, event) {
            if (getHasPermission(config, event.sender_id, event.sender_name, event.thread_id, moduleName)) {
                return origionalHelp.call(this, commandPrefix);
            }
            return false;
        };
    };

exports.load = function () {
    cfg = exports.platform.config.getConfig('admin');
    var loadedModules = exports.platform.modulesLoader.getLoadedModules();
    for (var i = 0; i < loadedModules.length; i++) {
        var help = loadedModules[i].help,
            match = loadedModules[i].match;

        loadedModules[i].help = helpHook(loadedModules[i].name, help, cfg);
        loadedModules[i].match = matchHook(loadedModules[i].name, match, cfg);
    }
};

exports.match = function (event, commandPrefix) {
    return event.arguments[0] === commandPrefix + 'admin';
};

exports.help = function (commandPrefix) {
    return [
        [commandPrefix + 'admin <grant/revoke> <fullName/userId> <permissionName>', 'Grant or revoke a permission for a user.',
            'Assigns/removes a permission from a user. Once a user has a permission they can use any core modules with the ' +
            'corresponding permission (and any that have no permissions/none configured).'],
        [commandPrefix + 'admin <create/delete> <coreModuleName> <permissionName>', 'Create or delete a permission for a core module.',
            'Creates/deletes a permission on a core module. A user with the corresponding permission can use the core module.']
    ];
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
