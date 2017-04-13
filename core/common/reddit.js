'use strict';

const reddit = require('redwrap');

exports.reddit = (subreddit, numberOfQueries, callback) => {
    reddit.r(subreddit).limit(numberOfQueries, (err, req) => {
        if (!err && req && req.data) {
            callback(false, req.data.children);
        }
        else {
            callback(true, `Well ${subreddit} fell on its face`);
        }
    });
};
