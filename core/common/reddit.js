/**
 * Provides helper methods for working with reddit.
 *
 * Written By:
 *              Matthew Knox
 *
 * License:
 *              MIT License. All code unless otherwise specified is
 *              Copyright (c) Matthew Knox and Contributors 2017.
 */

const reddit = require('redwrap'),
    util = require('util');

module.exports = exports = async(subreddit, numberOfQueries, callback) => {
    const limit = util.promisify((n, c) => reddit.r(subreddit).limit(n, c));
    let req = null, suc = true;
    try {
        req = (await limit(numberOfQueries)).data.children;
    }
    catch (e) {
        suc = false;
    }
    if (callback) {
        callback(suc, suc ? req : `Well ${subreddit} fell on its face`);
    }
    return req;
};
exports.reddit = exports; // backwards compatibility
