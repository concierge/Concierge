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

    if (disabled === true && exports.disabledConfig
        && exports.disabledConfig[kj.name] && exports.disabledConfig[kj.name] === true) {
        return false;
    }
    return true;
};

exports.verifyModule = function (location, disabled) {
    var stat = fs.statSync(location);
    if (!stat.isDirectory()) {
        return;
    }

    var folderPath = path.resolve(location),
        p = path.join(folderPath, './' + descriptor);
    try {
        stat = fs.statSync(p);
    }
    catch (e) {
        return null;
    }
    if (stat == null) {
        return;
    }

    var kj = require.once(p);
    if (!verifyModuleDescriptior(kj, disabled)) {
        return;
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
            if (output && output != null) {
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

exports.loadModule = function (module) {
    var modulePath  = module.folderPath,
        startPath   = path.join(modulePath, module.startup),
        index       = Object.keys(require.cache).indexOf(startPath),
        m           = null;

    try {
        m = require.once(startPath);
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
