/**
 * Gets a quote from https://theysaidso.com/api/
 *
 * Written By: Jay Harris
 * Date Written: 22/07/2015
 */

var wikiquote = require("./../common/wikiquote.js");

//Gets a quote from the specified author and passes it into the callback
exports.quote = function(author, callback) {
    if (!author || author.length == 0) {
        callback("Um.. what do you expect me to do?");
        return;
    }

    wikiquote.getRandomQuote(author, function(quote) {
        callback('"' + quote.quote + '" - ' + quote.titles);
    }, function(message){
        callback("Couldn't find any quotes :'(");
    });
}

// Make the quoter do its thing
exports.run = function(api, event) {
    // Strip the command and obtain the author
    var author = event.arguments_body;

    // get the quote
    exports.quote(author, function (result) {
        //Send the quote to Facebook
        api.sendMessage(result, event.thread_id);
    });
};
