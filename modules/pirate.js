var require_install = require('require-install'),
    request = require_install('request'),
    querystring = require("querystring");


exports.match = function(text) {
    return text.startsWith('/pirate');
};

exports.help = function() {
    return '/pirate <message> : Translates your message in pirate speak.';
};

exports.pirate = function (query, callback) {
    var uriEncodedQuery = querystring.stringify({text: query}),
        url = "http://isithackday.com/arrpi.php?" + uriEncodedQuery + "&format=json";


    request.get(url, function(error, response, body) {
        if (response.statusCode === 200 && response.body) {
            //fixme this could be dodgy
            var text = response.body,
                newText;
             newText = text.replace(/(.+:")|".+/g, "");
            if (newText) {
                callback(newText);
            }
            else {
                callback({error:'Well that was unexpected, api did not return a translation.'});
            }
        }
        else {
            callback({error:'Whomever the system admin is around here, I demand that they should be fired.'});
        }
    });
};

exports.search = function (query, callback) {
    //TODO waiting for update to anim to use same api to embed images in fb chat.
    if (query === undefined || query === '') {
        exports.pirate("I can't do anything with this", callback);
    }
    else {
        exports.pirate(query, callback);
    }
};

exports.run = function(api, event) {
    var query = event.body.substr(8);
    exports.search(query, function(result) {
        api.sendMessage(result, event.thread_id);
    });
};
