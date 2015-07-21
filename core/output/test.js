var readline = require('readline'),
	rl = NULL,
	api = {
		sendMessage: function(text, thread) {
			console.log(text);
		}
	},
	event = {
		type: "message",
		thread_id: 1,
		body: ""
	};

exports.start = function(callback) {
	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.on('line', function (cmd) {
		event.body = cmd;
		callback(api, event);
	});
};

exports.stop = function() {
	rl.close();
	rl = NULL;
};
