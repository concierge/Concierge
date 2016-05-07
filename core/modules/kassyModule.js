/**
 * Provides helper functions for handling user and system modules.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

var fs              = require('fs'),
    path            = require('path'),
    files           = require.once('./../files.js'),
    config          = require('./../config.js'),
    modulesDir      = 'modules',
    descriptor      = 'kassy.json';

var verifyModuleDescriptior = function (kj, disabled) {
    if (!kj.name || !kj.startup || !kj.version) {
        return false;
    }

    if (disabled === true && exports.disabledConfig &&
        exports.disabledConfig[kj.name] && exports.disabledConfig[kj.name] === true) {
        return false;
    }
    return true;
};

exports.verifyModule = function (location, disabled) {
    var stat = fs.statSync(location);
    if (!stat.isDirectory()) {
        return null;
    }

    var folderPath = path.resolve(location),
        p = path.join(folderPath, './' + descriptor);
    try {
        stat = fs.statSync(p);
        if (!stat) {
            return null;
        }
    }
    catch (e) {
        return null;
    }

    var kj = require.once(p);
    if (!verifyModuleDescriptior(kj, disabled)) {
        return null;
    }

    if (!kj.folderPath) {
        kj.folderPath = folderPath;
    }
    return kj;
};

exports.listModules = function (disabled) {
    var data = files.filesInDirectory('./' + modulesDir),
        modules = {};

    for (var i = 0; i < data.length; i++) {
        try {
            var candidate = path.resolve(path.join(modulesDir, data[i])),
                output = exports.verifyModule(candidate, disabled);
            if (output) {
                modules[output.name] = output;
            }
            else {
                console.debug('Skipping "' + data[i] + '". It isn\'t a Kassy module.');
            }
        } catch (e) {
            console.debug('A failure occured while listing "' + data[i] + '". It doesn\'t appear to be a module.');
            console.critical(e);
            continue;
        }
    }
    return modules;
};

var createHelp = function(module) {
    return function(commandPrefix) {
        var h = [];
        for (var i = 0; i < module.help.length; i++) {
            var l = [];
            for (var j = 0; j < module.help[i].length; j++) {
                l.push(module.help[i][j].replace(/{{commandPrefix}}/g, commandPrefix));
            }
            h.push(l);
        }
        return h;
    };
},

createMatcher = function(module) {
    return function(event, commandPrefix) {
        return event.arguments[0] === commandPrefix + module.command;
    };
},

createHistoricalMatcher = function(matcher) {
    return function(event, commandPrefix) {
        return matcher(event.body, commandPrefix);
    };
},

getFunctionParameterNames = function (func) {
    // http://stackoverflow.com/questions/9091838/get-function-parameter-names-for-interface-purposes
    var f = func.toString();
    return f.match(/\(.*?\)/)[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',');
};

exports.loadModule = function (module) {
    var modulePath  = module.folderPath,
        startPath   = path.join(modulePath, module.startup),
        m;

    try {
        m = require.once(startPath);
        if (!m.help) {
            if (!module.help) {
                throw 'A module must provide basic help.';
            }
            m.help = createHelp(module);
        }

        if (!m.match) {
            if (!module.command) {
                throw 'A module must provide a match function or command.';
            }
            m.match = createMatcher(module);
        }
        else if (getFunctionParameterNames(m.match)[0] === 'text') {
            m.match = createHistoricalMatcher(m.match);
        }
    }
    catch (e) {
        console.critical(e);
        throw 'Could not load module \'' + module.name + '\'. Does it have a syntax error?';
    }
    m.config = config.loadModuleConfig(module, modulePath);
    m.name = module.name;
    if (m.load) {
        m.load();
    }
    return m;
};
