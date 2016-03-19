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
	loaders			= [require.once('./kassyModule.js'), require.once('./hubotModule.js')],
    files           = require.once('./../files.js'),
    config          = require('./../config.js'),
    modulesDir      = 'modules',
    descriptor      = 'kassy.json',
	conflict		= 1;

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
        console.write("Loading module '" + module.name + "'... " + (console.isDebug() ? "\n" : ""));
        var m = loaders[module.__loaderUID].loadModule(module);
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

exports.verifyModule = function (path, disabled) {
    var mod = null;
    for (var i = 0; i < loaders.length; i++) {
        var t = loaders[i].verifyModule(path, disabled);
        if (t && t != null) {
            t.__loaderUID = i;
            break;
        }
    }
    return mod;
};
