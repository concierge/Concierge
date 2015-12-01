var skyweb = require('skyweb'),
	shim = require('../shim.js'),
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
	
	console.log('Logging into skype...');
	skype.login(exports.config.skype_username, exports.config.skype_password).then(function (account) {
		console.log('Successfully logged into skype as ' + skype.skypeAccount.selfInfo.username + '.');
		
		console.log('Creating contacts lookup table.');
		var scontacts = skype.contactsService.contacts;
		for (var i = 0; i < scontacts.length; i++) {
			var name = scontacts[i].display_name;
			contacts[scontacts[i].id] = name ? name : scontacts[i].id;
		}
		
		console.log('Creating platform API.');
		var api = {
			sendMessage: function(message, thread) {
				console.log('sending ' + message);
				skype.sendMessage(thread, message);
			}
		};
		platform = shim.createPlatformModule(api);
		
		console.log('Registering message received callback.');
		skype.messagesCallback = function (messages) {
			messages.forEach(function (message) {
				if (message.resource.messagetype === 'Text') {

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
	console.log('stopping');
	contacts = {};
	platform = null;
	skype = null;
};