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

var loaders         = [require.once('./kassyModule.js'), require.once('./hubotModule.js')],
    config          = require('./../config.js'),
    conflict        = 1;

exports.listModules = function (disabled) {
    var modules = {};
    for (var i = 0; i < loaders.length; i++) {
        var m = loaders[i].listModules(disabled);
        for (var key in m) {
            var t = key;
            while (modules[t]) {
                t = key + conflict++;
            }
            modules[t] = m[key];
            modules[t].__loaderUID = i;
        }
    }
    return modules;
};

exports.loadModule = function (module) {
    try {
        console.write('Loading module \'' + module.name + '\'... ' + (console.isDebug() ? '\n' : ''));
        var m = loaders[module.__loaderUID].loadModule(module);
        console.info(console.isDebug() ? 'Loading Succeeded' : '\t[DONE]');
        return m;
    }
    catch (e) {
        console.error(console.isDebug() ? 'Loading Failed' : '\t[FAIL]');
        console.critical(e);
        console.debug('Module "' + module.name + '" could not be loaded.');
        return null;
    }
};

exports.verifyModule = function (path, disabled) {
    var mod = null;
    for (var i = 0; i < loaders.length; i++) {
        mod = loaders[i].verifyModule(path, disabled);
        if (mod) {
            mod.__loaderUID = i;
            break;
        }
    }
    return mod;
};

exports.unloadModule = function(mod) {
    try {
        console.debug('Unloading module "' + mod.name + '".');
        if (mod.unload) {
            mod.unload();
        }
        config.saveModuleConfig(mod.name);
    }
    catch (e) {
        console.error('Unloading module "' + mod.name + '" failed.');
        console.critical(e);
    }
    return null;
};
