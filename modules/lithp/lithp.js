/** 
 * Gets makes things lithp
 *
 * Written By: Jay Harris
 * Date Written: 28/07/2015
 */

exports.run = function(api, event) {
    var text = event.arguments_body;
    if (text.trim() === "") {
        api.sendMessage("Lithping ith a thpecial thkill that I can't do on that thtring", event.thread_id);
        return;
    }

    text = text.replace(/s/gi, "th");
    text = text.replace(/r/gi, "w");

    api.sendMessage(text.capitiliseFirst(), event.thread_id);
};
