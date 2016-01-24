var request = require.safe('request'),
    querystring = require.safe("querystring");

exports.match = function(text, commandPrefix) {
    return text.startsWith(commandPrefix + 'pirate');
};

exports.help = function(commandPrefix) {
    return [[commandPrefix + 'pirate <message>','Translates your message into pirate speak.']];
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
    if (!query || query === '') {
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
