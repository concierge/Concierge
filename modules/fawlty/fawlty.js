/**
 * Gets a Fawlty Towers quote
 *
 * Written By: Jay Harris
 * Date Written: 21/07/2015
 */
var request = require.safe('request');

exports.match = function(text, commandPrefix) {
    return text.startsWith(commandPrefix + 'fawlty');
};

exports.help = function() {
    return this.commandPrefix + 'fawlty : Fixes fawlty code. Probably.';
};

var quotes = [
    'Sybil Fawlty: [on the phone] I know... I know... I know... Oh, I know!\nBasil Fawlty: Then why is she telling you?',
    'Basil Fawlty: [about Sybil\'s laugh] Sounds like somebody machine-gunning a seal.',
    'Basil Fawlty: Next contestant, Mrs. Sybil Fawlty from Torquay. Specialist subject - the bleeding obvious.',
    'Basil Fawlty: Right, well I\'ll go and have a lie down then. No I won\'t; I\'ll go and hit some guests.',
    'Basil Fawlty: Manuel will show you to your rooms - if you\'re lucky.',
    'Basil Fawlty: Coming my little piranha fish.',
    'Basil Fawlty: You\'ll have to forgive him. He\'s from Barcelona.',
    'Basil Fawlty: Don\'t be alarmed, it\'s only my wife laughing.',
    'Basil Fawlty: Do you remember when we were first *manacled* together? We used to laugh quite a lot.\nSybil Fawlty: Yes, but not at the same time, Basil.',
    'Basil Fawlty: We have a Spanish porter at the moment, he\'s from Barcelona. It\'d be quicker to train an *ape*!',
    'Basil Fawlty: [to Manuel] Stupidissimo! Continental cretin!',
    'Miss Gatsby: And don\'t do anything *we* wouldn\'t do!\nBasil Fawlty: Oh, just a little breathing, surely.',
    'Basil Fawlty: [to Sybil, while having dinner] Why don\'t you have another vat of wine, dear?',
    'Basil Fawlty: Oh look at that, a satisfied customer. We should have him stuffed.'
    ];

exports.run = function(api, event) {
    var index = Math.floor(Math.random() * quotes.length),
    result = quotes[index];

    api.sendMessage(result, event.thread_id);
};
