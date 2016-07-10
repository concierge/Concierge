var skyweb = require('skyweb'),
    skype = null,
    contacts = {},
    platform = null,

    shouldListenToChat = function(conversationId) {
        return !exports.config.conversations || exports.config.conversations.includes(conversationId);
    },

    findContactName = function(senderId) {
        return contacts[senderId] ? contacts[senderId] : senderId;
    };

exports.getApi = function() {
    return platform;
};

exports.start = function(callback) {
    skype = new skyweb();
    skype.login(exports.config.username, exports.config.password).then(function (account) {
        skype.setStatus('Online');
        let scontacts = skype.contactsService.contacts;
        for (let i = 0; i < scontacts.length; i++) {
            let name = scontacts[i].display_name;
            contacts[scontacts[i].id] = name ? name : scontacts[i].id;
        }

        let api = {
            commandPrefix: exports.config.commandPrefix,
            sendMessage: function(message, thread) {
                skype.sendMessage(thread, message);
            },
            getUsers: function() {
                return contacts;
            }
        };
        platform = shim.createIntegration(api);

        if (!exports.config.hasOwnProperty('acceptContactRequests') || exports.constructor.acceptContactRequests) {
            skype.authRequestCallback = function(requests) {
                for (let i = 0; i < requests.length; i++) {
                    skype.acceptAuthRequest(requests[i].sender);
                }
            };
        }

        skype.messagesCallback = function (messages) {
            messages.forEach(function (message) {
                if (message.resource.messagetype === 'Text' || message.resource.messagetype === 'RichText') {
                    let threadLink = message.resource.conversationLink,
                        threadId = threadLink.substring(threadLink.lastIndexOf('/') + 1),
                        content = message.resource.content,
                        senderId = message.resource.from.substring(message.resource.from.lastIndexOf(':') + 1),
                        senderName = findContactName(senderId);

                    if (shouldListenToChat(threadId)) {
                        let event = shim.createEvent(threadId, senderId, senderName, content);
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
