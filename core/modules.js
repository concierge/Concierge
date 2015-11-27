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
    files           = require('./files.js'),
    coreMoulesDir   = 'core/core_modules',
    modulesDir      = 'modules',
    descriptor      = 'kassy.json';

exports.listCoreModules = function (callback) {
    files.filesInDirectory('./' + coreMoulesDir, function (data) {
        data = data.filter(function (value) {
            return value.endsWith(".js");
        });
        callback(data);
    });
};

exports.loadCoreModule = function(platform, module) {
    var fp = path.resolve(__dirname, '../' + coreMoulesDir + '/' + module),
        index = Object.keys(require.cache).indexOf(fp),
        m = index !== -1 ? require.reload(fp) : require(fp);
    m.platform = exports;
    if (m.load) {
        m.load();
    }
    return m;
};

exports.listModules = function (callback) {
    files.filesInDirectory('./' + modulesDir, function (data) {

        var modules = {};

        for (var i = 0; i < data.length; i++) {
            var value = path.join(modulesDir, data[i]);

            var stat = fs.statSync(value);
            if (!stat.isDirectory()) {
                return false;
            }

            var p = path.join(value, '/' + descriptor);
            stat = fs.statSync(p);
            if (stat == null) {
                return false;
            }
            var kj = require.once(p);
            
            if (!kj.name) {
                return false;
            }

            modules[kj.name] = value;
        }

        callback(modules);
    });
};

exports.loadModule = function (module) {
    try {
        var modulePath = path.resolve(__dirname, '../' + modulesDir + '/' + module),
            kassyJson = require.once(path.join(modulePath, '/' + descriptor)),
            startPath = path.join(modulePath, '/' + kassyJson.startup),
            index = Object.keys(require.cache).indexOf(startPath),
            m = null;
        if (index !== -1) {
            console.info("Reloading module: " + module);
            m = require.reload(startPath);
        } else {
            console.info("New module found: " + module);
            m = require(startPath);
        }
        m.commandPrefix = exports.commandPrefix;
        m.config = config.getConfig(module);
        if (m.load) {
            m.load();
        }
        return m;
    }
    catch (e) {
        console.critical(e);
        console.error('Module \'' + module + '\' could not be loaded.');
        return null;
    }
};