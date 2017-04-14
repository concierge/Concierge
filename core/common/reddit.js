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

const reddit = require('redwrap');

module.exports = exports = (subreddit, numberOfQueries, callback) => {
    reddit.r(subreddit).limit(numberOfQueries, (err, req) => {
        if (!err && req && req.data) {
            callback(false, req.data.children);
        }
        else {
            callback(true, `Well ${subreddit} fell on its face`);
        }
    });
};
exports.reddit = exports; // backwards compatibility
