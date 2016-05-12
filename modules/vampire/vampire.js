/** 
 * Makes things vampiry
 *
 * Written By: James Fairbairn
 * Date Written: 29/07/2015
 */

exports.run = function(api, event) {
    var text = event.arguments_body;
    if (text.trim() === "") {
        api.sendMessage("I can't efen fampirise zat", event.thread_id);
        return;
    }

    text = text.replace(/v/gi, "f");    
    text = text.replace(/we /gi, "vee ");
    text = text.replace(/(wh)|w/gi, "v");
    text = text.replace(/th/gi, "z");

    api.sendMessage(text.capitiliseFirst(), event.thread_id);
};
