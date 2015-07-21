var readline = require('readline'),
	rl = null,
	api = {
		sendMessage: function(text, thread) {
			console.log(text);
		}
	},
	event = {
		type: "message",
		thread_id: 1,
		body: "",
		sender_name: "TESTING"
	};

exports.start = function(callback) {
	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	if (this.config.sender_name) {
		event.sender_name = this.config.sender_name;
	}
	rl.on('line', function (cmd) {
		event.body = cmd;
		callback(api, event);
	});
};

exports.stop = function() {
	rl.close();
	rl = null;
};
