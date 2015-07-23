var express = require('express'),
		request = require('request'),
		app = null,
		server,
		sendMessage = function(text, thread) {
			console.log("sending message");
			// fixme may not have access to this.config here
			var body = {
				"token": this.config.slack_token,
				"channel": thread,
				"username": this.config.name,
				"link_names": 1,
				"text": text
			};
			request({"uri":"https://slack.com/api/chat.postMessage",
				"method":"POST",
				"Content-Type": "application/json",
				"body": body});

		},
		sendAttachment = function(attachment, thread) {
			// fixme may not have acces to this.config here
			var body = {
				"token": this.config.slack_token,
				"channel": thread,
				"username": this.config.name,
				"link_names": 1,
				"attachment": [
					{
						"fallback": attachment,
						"image_url": attachment
					}
				]
			};
			request({"uri":"https://slack.com/api/chat.postMessage",
				"method":"POST",
				"Content-Type": "application/json",
				"body": body});

		};


exports.start = function (callback) {
	app = express();

	console.log("startedExpress");


	app.post('/', function (req, res) {
		var data = req.body;
		var event = [];
		var api = [];

		event.body = data.text;
		event.thread_id = data.channel_i;
		event.thread_name = data.channel_name;
		event.timestamp = data.timestamp;
		event.trigger = data.trigger_word;
		api.sendMessage = sendMessage;
		api.sendAttachment = sendAttachment;
		api.getUserId = data.user_id;
		api.getUserName = data.user_name;

		callback(api, event)


	});
	server = app.listen(this.config.port, function () {
		//server.close();
	});
};

//Store the channel_ids with a map to the channel name

	exports.stop = function() {
		server.close();
		server = null;
		app = null;
	};
