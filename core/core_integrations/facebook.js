var fb = require('facebook-chat-api'),
    fs = require('fs'),
    stopListeningMethod = null,
    platform = null,
    endTyping = null,
    platformApi = null,
    unknownIter = 1,
    threadInfo = {};

var getSenderInfo = function (ids, api, event, finished) {
    var callback = function(err, info) {
        if (err) {
            return finished('<Unknown User ' + unknownIter++ + '>');
        }
        for (var id in info) {
            threadInfo[event.threadID][id] = {
                name: info[id].name,
                email: 'unknown@foo.bar'
            };
        }
        return finished(threadInfo[event.threadID][event.senderID].name);
    };
    api.getUserInfo(ids, callback);
};

var getSenderName = function(api, event, finished) {
    if (threadInfo[event.threadID] && threadInfo[event.threadID][event.senderID]) {
        return finished(threadInfo[event.threadID][event.senderID].name);
    }

    if (!threadInfo[event.threadID]) {
        threadInfo[event.threadID] = {};
        api.getThreadInfo(event.threadID, function(err, info) {
            if (err) {
                return finished('<Unknown User ' + unknownIter++ + '>');
            }
            getSenderInfo(info.participantIDs, api, event, finished);
        });
    }
    else {
        getSenderInfo([event.senderID], api, event, finished);
    }
};

var stopTyping = function() {
    if (endTyping) {
        endTyping();
        endTyping = null;
    }
};

exports.getApi = function() {
    return platform;
};

exports.start = function(callback) {
    fb({email: this.config.username, password: this.config.password}, function (err, api) {
        if (err) {
            console.error(err);
            process.exit(-1);
        }

        var options = {
            listenEvents: true
        };
        if (!console.isDebug()) {
            options.logLevel = 'silent';
        }
        api.setOptions(options);
        platformApi = api;

        platform = shim.createIntegration({
            commandPrefix: exports.config.commandPrefix,
            sendMessage: function(message, thread) {
                stopTyping();
                api.sendMessage({body:message}, thread);
            },
            sendUrl: function(url, thread) {
                stopTyping();
                api.sendMessage({body: url, url: url}, thread);
            },
            sendImage: function(type, image, description, thread) {
                stopTyping();
                switch (type) {
                case 'url':
                    api.sendMessage({body: description, url: image}, thread, function(err) {
                        if (err) {
                            api.sendMessage(description + ' ' + image, thread);
                        }
                    });
                    break;
                case 'file':
                    api.sendMessage({body: description, attachment: fs.createReadStream(image)}, thread);
                    break;
                default:
                    api.sendMessage(description, thread);
                    api.sendMessage(image, thread);
                    break;
                }
            },
            sendFile: function () {
                this.sendImage.apply(this, arguments);
            },
            sendTyping: function(thread) {
                stopTyping();
                api.sendTypingIndicator(thread, function(err, end) {
                    if (!err) {
                        endTyping = end;
                    }
                });
            },
            setTitle: function(title, thread) {
                stopTyping();
                api.setTitle(title, thread);
            },
            getUsers: function(thread) {
                return threadInfo[thread];
            }
        });

        var stopListening = api.listen(function(err, event) {
            if (err) {
                stopListening();
                console.error(err);
                process.exit(-1);
            }

            switch (event.type) {
            case 'message':
                getSenderName(api, event, function(name) {
                    var data = shim.createEvent(event.threadID, event.senderID, name, event.body + '');
                    callback(platform, data);
                });
                break;
            case 'event':
                switch (event.logMessageType) {
                case 'log:unsubscribe':
                    var usrs = event.logMessageData.removed_participants;
                    for (var i = 0; i < usrs.length; i++) {
                        usrs[i] = usrs[i].split(':')[1];
                        if (threadInfo[event.threadID] && threadInfo[event.threadID][usrs[i]]) {
                            delete threadInfo[event.threadID][usrs[i]];
                        }
                    }
                    break;
                case 'log:subscribe':
                    usrs = event.logMessageData.added_participants;
                    for (var i = 0; i < usrs.length; i++) {
                        usrs[i] = usrs[i].split(':')[1];
                    }
                    getSenderInfo(usrs, api, event, function(){});
                    break;
                }
                break;
            }
        });

        stopListeningMethod = function () {
            stopListening();
            api.logout();
        };
    });
};

exports.stop = function() {
    stopTyping();
    stopListeningMethod();
    platformApi.logout();
    platform = null;
};
