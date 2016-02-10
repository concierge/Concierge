/**
 * MyAnimeList search module
 * returns the title description and some stats
 *
 * Written By: Paras D. Pain
 * Date Written: 10/02/2016
 */

var request = require('request');

// Paths
var HUMMINGBIRD_HOST = "hummingbird.me/api/v1"
var HUMMINGBIRD_SEARCH = "/search/anime/"

exports.match = function(text, commandPrefix) {
    // The space makes sure the command is exact and not a mere prefix
    return text.startsWith(commandPrefix + 'humming ');
};

exports.help = function(commandPrefix) {
    return [[commandPrefix + 'mal <query>','Searches Anime or Manga when you are too lazy to make a few clicks']];
};

exports.run = function(api, event) {
    var query = event.body.substr(8),
        result = search(query);
    
	api.sendMessage(result, event.thread_id);
};

/**
 * Retrieves information about an anime as a JSON object.
 *
 * query:       string to search
 * callback:    takes the error, and data
 */
function search(query, callback) {
    request.get({
        uri: "https://" + HUMMINGBIRD_HOST + 
             HUMMINGBIRD_SEARCH + "?query=" + 
             query // Fuzzy search supported by server
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
            // returned object is JSON
            callback(null, body);
        }
    });
};