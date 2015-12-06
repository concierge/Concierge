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

var files           = require.once('./files.js'),
    path            = require('path'),
    modesLocation   = './core/output';

exports.listModes = function () {
    var modes = files.filesInDirectory(modesLocation);
    for (var i = 0; i < modes.length; i++) {
        modes[i] = path.basename(modes[i], '.js').toLowerCase();
    }
	return modes;
};