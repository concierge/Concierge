/**
 * MyAnimeList search module
 * returns the title description and some stats
 *
 * Written By: Paras D. Pain
 * Date Written: 10/02/2016
 */

// HummingBird API caller
var humming = require("./../common/humming.js");


exports.match = function(text, commandPrefix) {
    // The space makes sure the command is exact and not a mere prefix
    return text.startsWith(commandPrefix + 'mal ')
    || text.startsWith(commandPrefix + 'mal-search ');
};

/*
	Method that provides help strings for use with this module.
*/
exports.help = function(commandPrefix) {
    return [[commandPrefix + 'mal <query>','Searches Anime or Manga when you are too lazy to make a few clicks'],
            [commandPrefix + 'mal-search <query>', 'Find the top results matching the query']];
};

/*
	The main entry point of the module. This will be called by Kassy whenever the match function
	above returns true.
*/
exports.run = function(api, event) {
    var result, query;
    // Check for command type
    if(event.body.startsWith("mal search")){
        query = event.body.substr(11);
        result = searchQuery(query);
    } else {
        query = event.body.substr(4);
        result = generalQuery(query);
    }
    
	api.sendMessage(result, event.thread_id);
};

function searchQuery(query){
    return humming.searchTopResult(query);
}

function generalQuery(query){
    return humming.search(query);
}