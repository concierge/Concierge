var fb = require("facebook-chat-api");

exports.start = function(username, password, messageCallback) {
	fb({email: username, password: password}, function callback (err, api) {	
		if(err) {
			console.error(err);
			process.exit(-1);
		}
		api.setOptions({listenEvents: true});
		api.listen(function(err, event, stopListening) {
			if (err) {
				stopListening();
				console.error(err);
				process.exit(-1);
			}
			switch(event.type) {
				case "message": {
					if (event.body === '/shutdown') {
						var shutdownResponses = ['Good Night', 'I don\'t blame you.', 'There you are.', 'Please.... No, Noooo!'];
						var index = Math.floor(Math.random() * shutdownResponses.length);
						api.sendMessage(shutdownResponses[index], event.thread_id);
						stopListening();
					}
					else {
						messageCallback(api, event);
					}
					break;
				}
			}
		});
	});
};