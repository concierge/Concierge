/**
 * MyAnimeList search module
 * returns the title description and some stats
 *
 * Written By: Paras D. Pain
 * Date Written: 10/02/2016
 */

var request = require.safe('request');
console.debug('line 10');

/*
* Paths
*/
var config = {}

config.HUMMINGBIRD_HOST = "hummingbird.me/api/v1"
config.HUMMINGBIRD_SEARCH = "/search/anime/"

exports.match = function(text, commandPrefix) {
    // The space makes sure the command is exact and not a mere prefix
    console.debug('line 23');
    return text.startsWith(commandPrefix + 'humming ');
};

/*
	Method that provides help strings for use with this module.
*/
exports.help = function(commandPrefix) {
    return [[commandPrefix + 'humming <query>','Searches Anime or Manga when you are too lazy to make a few clicks']];
};

/*
	The main entry point of the module. This will be called by Kassy whenever the match function
	above returns true.
*/
exports.run = function(api, event) {
    // Check for command type
    if(event.body.startsWith("humming ")){
        var query = event.body.substr(8);
        
        console.debug('line 40');
        
        search(query, function(error, response){
            // Callback calls the parser if no errors were registered
            if(error !== null){
                api.sendMessage(parse(response), event.thread_id);
            } else{
                console.debug(error);
            }
        });
    }
};

function parse(query){
    // testing
    return JSON.stringify(query);
    // return 'parser reached';
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
             query // Fuzzy search supported by server
    }, function(err, res, body) {
        
        console.debug('line 73');
        
        if(err) {
            if(res) {
                callback("Request error: " + err + ", " + res.statusCode, body);
            }
            else {
                callback("Connection error: not connected to internet", body);
            }
        }
        else {
            callback(null, body);
        }
    });
};