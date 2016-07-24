/**
    * Provides helper functions for working with files.
    *
    * Written By:
    *              Matthew Knox
    *
    * License:
    *              MIT License. All code unless otherwise specified is
    *              Copyright (c) Matthew Knox and Contributors 2015.
    */

var fs = require('fs');

exports.filesInDirectory = function (directory) {
    try {
        var files = fs.readdirSync(directory);
        if (files == null) {
            throw 'No files found.';
        }
        return files;
    }
    catch (e) {
        if (exports.debug && err) {
            console.error(err);
            console.trace();
        }
        return [];
    }
};
