/**
 * Provides helper functions for handling user and system modules.
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2015.
 */

var path            = require('path'),
    files           = require.once('./../files.js'),
    coreMoulesDir   = 'core/core_modules';

exports.listCoreModules = function () {
    var data = files.filesInDirectory('./' + coreMoulesDir);
    data = data.filter(function (value) {
        return value.endsWith('.js');
    });
    return data;
};

exports.loadCoreModule = function(platform, module) {
    var fp = path.resolve('./' + coreMoulesDir + '/' + module),
        index = Object.keys(require.cache).indexOf(fp),
        m = index !== -1 ? require.reload(fp) : require.once(fp);
    m.platform = exports.platform;
    m.name = module.split('.')[0];
    return m;
};

exports.loadingComplete = function (modules) {
    for (var i = 0; i < modules.length; i++) {
        if (modules[i].load) {
            modules[i].load.call(modules[i].platform);
        }
    }
};

exports.unloadCoreModule = function(mod) {
    try {
        console.debug('Unloading core module "' + mod.name + '".');
        if (mod.unload) {
            mod.unload();
        }
    }
    catch (e) {
        console.error('Unloading core module "' + mod.name + '" failed.');
        console.critical(e);
    }
    return null;
};
