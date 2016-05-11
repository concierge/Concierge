exports.createPlatformModule = function(platform) {
	if (!platform.sendMessage) {
		platform.sendMessage = function() {
			throw 'What kind of shit platform is this that doesn\'t even support sending messages?';
		};
	}

	if (!platform.sendUrl) {
		platform.sendUrl = function(url, thread) {
			platform.sendMessage(url, thread); // fallback to sending a message
		};
	}

	if (!platform.sendImage) {
		platform.sendImage = function(type, image, description, thread) {
			switch(type) {
				case 'url': // fallback to sending a url
					platform.sendMessage(description, thread);
					platform.sendUrl(image, thread);
					break;
				case 'file': // fallback to sending a file
					platform.sendFile(type, file, description, thread);
					break;
				default: // fallback to sending a message
					platform.sendMessage(description, thread);
					platform.sendMessage('I also have something to send you but cant seem to do so...', thread);
					break;
			}
		};
	}

	if (!platform.sendFile) {
		platform.sendFile = function(type, file, description, thread) {
			platform.sendMessage(description, thread);
			switch(type) {
				case 'url': // fallback to sending a url
					platform.sendUrl(file, thread);
					break;
				case 'file': // fallback to sending a message
					platform.sendMessage('I have a file to send you but cant seem to do so...', thread);
					break;
				default: // fallback to sending a message
					platform.sendMessage('I have something to send you but cant seem to do so...', thread);
					break;
			}
		}
	}

	if (!platform.sendTyping) {
		platform.sendTyping = function(thread) {
			//TODO fix me
			platform.sendMessage('Working on it...', thread); // fallback to sending a message
		}
	}

	if (!platform.setTitle) {
		platform.setTitle = function(title, thread) { // fallback to sending a message
			platform.sendMessage('If I could set the title of this chat I would set it to "' + title + '"', thread);
		}
	}

    if (!platform.sendPrivateMessage) {
        platform.sendPrivateMessage = function (message, thread) {
            platform.sendMessage(message, thread);
        }
    }

	if (!platform.commandPrefix) {
		if (platform.config && platform.config.commandPrefix) {
			platform.commandPrefix = platform.config.commandPrefix;
		}
		else {
			platform.commandPrefix = '/';
		}
	}

	return platform;
};

exports.createEvent = function(thread, senderId, senderName, message) {
	var event = {
		thread_id: thread,
		sender_id: senderId,
		sender_name: senderName + "", // Accept sender_name  = null as a literal
		body: message
    };
    event.arguments = event.body.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (event.arguments === null) {
        event.arguments = [''];
    }
    event.arguments_body = event.body.substr(event.arguments[0].length + 1);
    for (var i = 0; i < event.arguments.length; i++) {
        event.arguments[i] = event.arguments[i].replace(/(^["])|(["]$)/g, '');
    }
    return event;
};
