var readline = require('readline'),
	rl = null,
	shim = require.once('../shim.js'),
	api = null,
	senderName = "TESTING";

exports.start = function(callback) {
	api = shim.createPlatformModule({
		commandPrefix: exports.config.commandPrefix,
		sendMessage: function(message, thread) {
			console.log(message);
		}
	}),

	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	if (this.config.sender_name) {
		event.sender_name = this.config.sender_name;
	}

	rl.on('line', function (cmd) {
		if (cmd.startsWith(exports.config.commandPrefix + "setuser")) {
			var name = cmd.substr(9);
			senderName = name;
			return;
		}

		var event = shim.createEvent(1, 0, senderName, cmd);
		callback(api, event);
	});
};

exports.stop = function() {
	rl.close();
	rl = null;
};
