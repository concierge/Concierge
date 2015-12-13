var request = require.safe('request'),
    reddit = require.safe('redwrap');

exports.reddit = function(thing, numberOfQueries, callback) {
    reddit.r(thing).limit(numberOfQueries, function(err, req, res){
        if (!err && req && req.data) {
            callback(false, req.data.children);
        }
        else {
            callback(true, 'Well '+ thing +' fell on its face');
        }
    });
};