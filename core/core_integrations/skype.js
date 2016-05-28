var skyweb = require('skyweb'),
    shim = require.once('../shim.js'),
    skype = null,
    contacts = {},
    platform = null,

shouldListenToChat = function(conversationId) {
    return !exports.config.conversations || exports.config.conversations.includes(conversationId);
},

findContactName = function(id) {
    return contacts[id] ? contacts[id] : id;
};

exports.start = function(callback) {
    skype = new skyweb();
    skype.login(exports.config.username, exports.config.password).then(function (account) {
        var scontacts = skype.contactsService.contacts;
        for (var i = 0; i < scontacts.length; i++) {
            var name = scontacts[i].display_name;
            contacts[scontacts[i].id] = name ? name : scontacts[i].id;
        }

        var api = {
            commandPrefix: exports.config.commandPrefix,
            sendMessage: function(message, thread) {
                skype.sendMessage(thread, message);
            }
        };
        platform = shim.createPlatformModule(api);

        skype.messagesCallback = function (messages) {
            messages.forEach(function (message) {
                if (message.resource.messagetype === 'Text' || message.resource.messagetype === 'RichText') {
                    var threadLink = message.resource.conversationLink,
                        threadId = threadLink.substring(threadLink.lastIndexOf('/') + 1),
                        content = message.resource.content,
                        senderId = message.resource.from.substring(message.resource.from.lastIndexOf(':') + 1),
                        senderName = findContactName(senderId);

                    if (shouldListenToChat(threadId)) {
                        var event = shim.createEvent(threadId, senderId, senderName, content);
                        callback(platform, event);
                    }
                }
            });
        };
    });
};

exports.stop = function() {
    contacts = {};
    platform = null;
    skype = null;
};
