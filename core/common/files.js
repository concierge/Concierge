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
 * Lists all the file system entries in a directory (sync).
 * @param {string} directory directory to list the file system entries of.
 * @return {Array<string>} the file system entries in the directory. If the directory
 * does not exist or there is a problem listing its contents, this will be an empty
 * array.
 */
exports.filesInDirectory = directory => {
    try {
        const files = fs.readdirSync(directory);
        if (files === null) {
            throw new Error('No files found.');
        }
        return files;
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
exports.deleteDirectory = (directory, callback) => {
    const files = exports.filesInDirectory(directory).map(f => path.join(directory, f));
    const promises = [];
    for (let file of files) {
        promises.push(new Promise((resolve, reject) => {
            fs.lstat(file, (err, stats) => {
                if (err) {
                    throw (LOG.error(err), err);
                }
                const resolver = e => e ? LOG.error(e) && reject(false) : resolve(true);
                if (stats.isDirectory()) {
                    exports.deleteDirectory(file, resolver);
                }
                else {
                    fs.chmodSync(file, 666);
                    fs.unlink(file, resolver);
                }
            });
        }));
    }
    Promise.all(promises).then(() => {
        fs.chmodSync(directory, 666);
        fs.rmdir(directory, e => callback(e ? (LOG.error(e), e) : null));
    }, () => callback('Error'));
};

/**
 * Determines if a file system entry exists, and if it does, what it is.
 * @param {string} p the path to the file system entry to check.
 * @returns {string|boolean} false if it doesn't exist, 'directory', 'file' or
 * 'other' otherwise.
 */
exports.existsSync = p => {
    try {
        const stat = fs.lstatSync(p);
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
