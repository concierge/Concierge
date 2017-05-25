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

const fs = require('fs'),
    path = require('path');

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

exports.deleteDirectory = (directory, callback) => {
    const files = exports.filesInDirectory(directory).map(f => path.join(directory, f));
    const promises = [];
    for (let file of files) {
        promises.push(new Promise((resolve, reject) => {
            const stat = fs.lstat(file, (err, stats) => {
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
