var fb = require("facebook-chat-api"),
	stopListeningMethod = NULL;

exports.start = function(callback) {
	fb({email: this.config.username, password: this.config.password}, function (err, api) {
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
			stopListeningMethod = stopListening;
			switch(event.type) {
				case "message": {
					callback(api, event);
					break;
				}
			}
		});
	});
};

exports.stop = function() {
	stopListeningMethod();
};
