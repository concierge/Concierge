/**
 * Provides helper functions for working with files.
 *
 * Written By:
 *              Matthew Knox
 *
 * License:
 *              MIT License. All code unless otherwise specified is
 *              Copyright (c) Matthew Knox and Contributors 2017.
 */

const fs = require('fs');
exports.filesInDirectory = (directory) => {
    try {
        const files = fs.readdirSync(directory);
        if (files === null) {
            throw new Error('No files found.');
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
