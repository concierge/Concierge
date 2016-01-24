/** Simply does what it says..
 *
 * Written By: Matt Hartstonge
 * Date Written: 21/07/2015
 */

// Define the 'regex' command matching criteria boolean
exports.match = function(text, commandPrefix) {
    return text.startsWith(commandPrefix + 'slap');
};

// Give users help if they can't slaps
exports.help = function(commandPrefix) {
    return [[commandPrefix + 'slap <infidel>','Slaps an annoying infidel - descriptively!']];
};


// The main slapper
exports.slap = function(sender_name, infidel){
    var adjectives = [
        'lovingly',
        'while crying',
        'passionately',
        'harshly',
        'in a rebuke-like fashion',
        'harder than how they slapped ' + infidel + '\'s mother last night',
        'bluntly',
        'with a spoon',
        'with a salmon',
        'with a python',
        'so he can C#',
        'because ' + sender_name + '\'s anaconda don\'t want nothing less it\'s got buns hun',
        'just because',
        'while caressing ' + infidel + '\'s buttocks',
        'just because',
        'cause I ain\'t got nothing else',
        'for Mother Russia',
        'all sexy like'
    ];

    var index = Math.floor(Math.random() * adjectives.length);
    return sender_name + ' *slaps* ' + infidel + ' ' + adjectives[index];
};

// Make the slapper work for it's money
exports.run = function(api, event) {
    // Strip the command and obtain the query
    var query = event.body.substr(5 + api.commandPrefix.length);

    // get the feels
    var result = exports.slap(event.sender_name.trim(), query);

    // Send to facebook
    api.sendMessage(result, event.thread_id);
};
