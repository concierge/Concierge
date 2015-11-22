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

var files           = require('./files.js'),
    coreMoulesDir   = 'core/core_modules',
    modulesDir      = 'modules';

exports.listModules = function (directory, callback) {
    files.filesInDirectory('./' + directory, function (data) {
        data = data.filter(function (value) {
            return value.endsWith(".js");
        });
        callback(data);
    });
};