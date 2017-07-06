/**
 * Provides helper functions for working with files.
 * Like fs, but with improvements.
 *
 * Written By:
 *              Matthew Knox
 *
 * License:
 *              MIT License. All code unless otherwise specified is
 *              Copyright (c) Matthew Knox and Contributors 2017.
 */

const fs = require('fs'),
    path = require('path'),
    util = require('util');

// make promisified version of all callback apis
for (let m in fs) {
    if (fs[m + 'Sync']) {
        exports[m] = util.promisify(fs[m]);
    }
}

/**
 * Lists all the file system entries in a directory.
 * @param {string} directory directory to list the file system entries of.
 * @return {Array<string>} the file system entries in the directory. If the directory
 * does not exist or there is a problem listing its contents, this will be an empty
 * array.
 */
exports.filesInDirectory = async(directory) => {
    try {
        const files = await exports.readdir(directory);
        return !files ? [] : files;
    }
    catch (e) {
        return [];
    }
};

/**
 * Delete a directory. Unlike fs.rmdir which will not delete a directory with
 * content, this method will delete a directory regardless of contents. Does not
 * follow symlinks.
 * @param {string} directory the (potentially non-empty) directory to delete.
 * @param {function()} callback method called on success or failure, (error).
 */
exports.deleteDirectory = async(directory) => {
    await Promise.all((await exports.filesInDirectory(directory)).map(async(file) => {
        file = path.join(directory, file);
        try {
            if (await exports.fileExists(file) === 'directory') {
                await exports.deleteDirectory(file);
            }
            else {
                await exports.chmod(file, 666);
                await exports.unlink(file);
            }
            return true;
        }
        catch (e) {
            throw (LOG.error(e), e);
        }
    }));
    await exports.chmod(directory, 666);
    return await exports.rmdir(directory);
};

/**
 * Determines if a file system entry exists, and if it does, what it is.
 * @param {string} p the path to the file system entry to check.
 * @returns {string|boolean} false if it doesn't exist, 'directory', 'file' or
 * 'other' otherwise.
 */
exports.fileExists = async(p) => {
    try {
        const stat = await exports.lstat(p);
        if (stat.isDirectory()) {
            return 'directory';
        }
        if (stat.isFile()) {
            return 'file';
        }
        return 'other';
    }
    catch (e) {
        return false;
    }
};

/**
 * Parses an arbitary JSON file without the overhead of require.
 * @param {string} file the JSON file to load.
 * @returns {object} the JSON representation of the file.
 */
exports.readJson = async(file) => {
    const data = await exports.readFile(file, 'utf8');
    return JSON.parse(data.replace(/^\uFEFF/, ''));
};
