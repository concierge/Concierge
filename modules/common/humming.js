var request = require('request');

/*
* Paths
*/
var config = {}

config.HUMMINGBIRD_HOST = "hummingbirdv1.p.mashape.com"
config.HUMMINGBIRD_SEARCH = "/search/anime/"

/*
* Parser
*/
function querify(name) {
    // removes dashes
    var result = name.replace(/-/g, '');
    
    // replace spaces with pluses
    return result.replace(/[\s]+/g, '+');
}

/**
 * Retrieves information about an anime as a JSON object.
 *
 * query:       string to search
 * callback:    takes the error, and data
 */
function search(query, callback) {
    request.get({
        uri: "https://" + config.HUMMINGBIRD_HOST + 
             config.HUMMINGBIRD_SEARCH + "?query=" + 
             querify(query),
        headers: {
            // 'X-Mashape-Key': creds.HUMMINGBIRD_API_KEY,
            'Content-Type': "application/x-www-form-urlencoded"
        }
    }, function(err, res, body) {
        if(err) {
            if(res) {
                callback("Request error: " + err + ", " + res.statusCode, body);
            }
            else {
                callback("Connection error: not connected to internet", body);
            }
        }
        else {
            callback(null, JSON.parse(body));
        }
    });
};

function searchTopResult(query, callback) {
    search(querify(query), function(err, result) {
        if(err) {
            callback(err, result);
        }
        else {
            callback(null, result[0]);
        }
    });
};