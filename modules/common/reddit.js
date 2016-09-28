var reddit = require('redwrap');

exports.reddit = function(thing, numberOfQueries, callback) {
    reddit.r(thing).limit(numberOfQueries, function(err, req){
        if (!err && req && req.data) {
            callback(false, req.data.children);
        }
        else {
            callback(true, 'Well ' + thing + ' fell on its face');
        }
    });
};
