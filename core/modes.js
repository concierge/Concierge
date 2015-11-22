/**
 * Provides helper functions for handling output modes.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

var files           = require('./files.js'),
    path            = require('path'),
    modesLocation   = './core/output';

exports.listModes = function (callback) {
    files.filesInDirectory(modesLocation, function (files) {
        var obj = {};
        for (var i = 0; i < files.length; i++) {
            var name = path.basename(files[i], '.js').toLowerCase();
            obj[name] = files[i];
        }
        callback(obj);
    });
};