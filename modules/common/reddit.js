var require_install = require('require-install'),
    request = require_install('request'),
    reddit = require_install('redwrap');


exports.reddit = function(thing, numberOfQueries, callback) {
    reddit.r(thing).limit(numberOfQueries, function(err, req, res){
        if (err || req !== null || req !== undefined) {
            callback(false, req.data.children);
        }
        else {
            callback(true, 'Well '+ thing +' fell on its face');
        }
    });
};