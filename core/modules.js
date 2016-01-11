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
    files           = require.once('./files.js'),
    config          = require('./config.js'),
    coreMoulesDir   = 'core/core_modules',
    modulesDir      = 'modules',
    descriptor      = 'kassy.json';

exports.listCoreModules = function () {
    var data = files.filesInDirectory('./' + coreMoulesDir);
    data = data.filter(function (value) {
        return value.endsWith(".js");
    });
    return data;
};

exports.loadCoreModule = function(platform, module) {
    var fp = path.resolve(__dirname, '../' + coreMoulesDir + '/' + module),
        index = Object.keys(require.cache).indexOf(fp),
        m = index !== -1 ? require.reload(fp) : require.once(fp);
    m.platform = exports;
    m.name = module;
    if (m.load) {
        m.load();
    }
    return m;
};

exports.verifyModuleDescriptior = function (kj, disabled) {
	if (!kj.name || !kj.startup || !kj.version) {
		return false;
	}

	if (disabled === true && exports.disabledConfig
		&& exports.disabledConfig[kj.name] && exports.disabledConfig[kj.name] === true) {
		return false;
	}
	return true;
};

exports.listModules = function (disabled) {
    var data = files.filesInDirectory('./' + modulesDir),
        modules = {};

    for (var i = 0; i < data.length; i++) {
        try {
            var value = path.join(modulesDir, data[i]),
                stat = fs.statSync(value);
            if (!stat.isDirectory()) {
                continue;
            }

            var folderPath = path.join(__dirname, './../' + value),
                p = path.join(folderPath, '/' + descriptor);
            stat = fs.statSync(p);
            if (stat == null) {
                continue;
            }

            var kj = require.once(p);
            if (!exports.verifyModuleDescriptior(kj, disabled)) {
                continue;
            }

            if (!kj.folderPath) {
                kj.folderPath = folderPath;
            }
            modules[kj.name] = kj;
        } catch (e) {
            console.debug('A failure occured while listing "' + data[i] + '". It doesn\'t appear to be a module.');
            continue;
        }
    }
    return modules;
};

exports.loadModule = function (module) {
    try {
        var modulePath  = module.folderPath,
            startPath   = path.join(modulePath, module.startup),
            index       = Object.keys(require.cache).indexOf(startPath),
            m           = null;

        try {
            if (index !== -1) {
                console.write("Reloading module: '" + module.name + "'... " + (console.isDebug() ? "\n" : ""));
                m = require.reload(startPath);
            } else {
                console.write("Loading module '" + module.name + "'... " + (console.isDebug() ? "\n" : ""));
                m = require.once(startPath);
            }
        } catch (e) {
            console.critical(e);
            throw 'Could not load module \'' + module.name + '\'. Does it have a syntax error?';
        }
        m.config = config.loadModuleConfig(module, modulePath);
        m.name = module.name;
        if (m.load) {
            m.load();
        }
        console.info(console.isDebug() ? "Loading Succeeded" : "\t[DONE]");
        return m;
    }
    catch (e) {
        console.error(console.isDebug() ? "Loading Failed" : "\t[FAIL]");
        console.critical(e);
        console.debug('Module \'' + module.name + '\' could not be loaded.');
        return null;
    }
};
