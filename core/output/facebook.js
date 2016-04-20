var fb = require("facebook-chat-api"),
	fs = require("fs"),
	shim = require.once("../shim.js"),
	stopListeningMethod = null,
	platform = null,
	endTyping = null,
	platformApi = null,
	threadInfo = {};

var getSenderName = function(api, event, finished) {
	if (threadInfo[event.threadID] && threadInfo[event.threadID][event.senderID]) {
		return finished(threadInfo[event.threadID][event.senderID]);
	}

	var callback = function(err, info) {
		if (err) {
			return finished('<Unknown User>');
		}
		for (var id in info) {
			threadInfo[event.threadID][id] = info[id].name;
		}
		return finished(threadInfo[event.threadID][event.senderID]);
	};

	if (!threadInfo[event.threadID]) {
		threadInfo[event.threadID] = {};
		api.getThreadInfo(event.threadID, function(err, info) {
			if (err) {
				return finished('<Unknown User>');
			}
			api.getUserInfo(info.participantIDs, callback);
		});
	}
	else {
		api.getUserInfo([event.senderID], callback);
	}
};

exports.start = function(callback) {
	fb({email: this.config.username, password: this.config.password}, function (err, api) {
		if(err) {
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

		platform = shim.createPlatformModule({
			commandPrefix: exports.config.commandPrefix,
			sendMessage: function(message, thread) {
				if (endTyping != null) {
					endTyping();
					endTyping = null;
				}
				api.sendMessage({body:message}, thread);
			},
			sendUrl: function(url, thread) {
				if (endTyping != null) {
					endTyping();
					endTyping = null;
				}
				api.sendMessage({body: url, url: url}, thread);
			},
			sendImage: function(type, image, description, thread) {
				if (endTyping != null) {
					endTyping();
					endTyping = null;
				}
				switch (type) {
					case "url":
						api.sendMessage({body: description, url: image}, thread, function(err, messageInfo) {
							if (err) {
								api.sendMessage(description + " " + image, thread);
							}
						});
						break;
					case "file":
						api.sendMessage({body: description, attachment: fs.createReadStream(image)}, thread);
						break;
					default:
						api.sendMessage(description, thread);
						api.sendMessage(image, thread);
						break;
				}
			},
			sendFile: this.sendImage,
			sendTyping: function(thread) {
				if (endTyping != null) {
					endTyping();
					endTyping = null;
				}
				api.sendTypingIndicator(thread, function(err, end) {
					if (!err) {
						endTyping = end;
					}
				});
			},
			setTitle: function(title, thread) {
				if (endTyping != null) {
					endTyping();
					endTyping = null;
				}
				api.setTitle(title, thread);
			}
		});

		var stopListening = api.listen(function(err, event) {
			if (err) {
				stopListening();
				console.error(err);
				process.exit(-1);
			}
			stopListeningMethod = function() {
				stopListening();
				api.logout();
			};
			switch(event.type) {
				case "message": {
					getSenderName(api, event, function(name) {
						var data = shim.createEvent(event.threadID, event.senderID, name, event.body);
						callback(platform, data);
					});
					break;
				}
			}
		});
	});
};

exports.stop = function() {
	if (endTyping != null) {
		endTyping();
		endTyping = null;
	}
	stopListeningMethod();
	platformApi.logout();
	platform = null;
};
