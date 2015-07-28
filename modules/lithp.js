/** 
 * Gets makes things lithp
 *
 * Written By: Jay Harris
 * Date Written: 28/07/2015
 */
exports.match = function(text) {
    return text.startsWith('/lithp');
};

exports.help = function() {
    return '/lithp : Speaks with a lisp';
};

exports.run = function(api, event) {
    var text = event.body.substring(7);

    text = text.replace(/s/g, "th");
    text = text.replace(/r/g, "w");

    api.sendMessage(text, event.thread_id);
};
