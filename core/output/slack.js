var express = require('express'),
	bodyParser  = require("body-parser"),
	request = require('request'),
	app = null,
	server,
	sendMessage = function(text, thread) {
			console.log("sending message");
			// fixme may not have access to this.config here
			var body = {
				"token": exports.config.slack_token,
				"channel": thread,
				"username": exports.config.name,
				"link_names": 1,
				"text": text
			};


				
			request({"uri":"https://slack.com/api/chat.postMessage",
				"method":"GET",
				"qs": body}, function (error, response, body) {
	      if(response.statusCode == 200){
        console.log('success');
      } 
	else {
        console.log('error: '+ response.statusCode);
        console.log(body);
      }
    });

		},
		sendAttachment = function(attachment, thread) {
			// fixme may not have acces to this.config here
			var body = {
				"token": exports.config.slack_token,
				"channel": thread,
				"username": exports.config.name,
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

	
	 app.use(bodyParser.json());
      	app.use(bodyParser.urlencoded({ extended: true }));
	app.post('/', function (req, res) {
		var data = req.body;
		var event = [];
		var api = [];
		
		//console.log(data);	
		if (data.user_name != 'slackbot') {
			event.body = data.text.trim();
			event.thread_id = data.channel_id;
			event.thread_name = data.channel_name;
			event.timestamp = data.timestamp;
			event.sender_name = data.user_name;
			api.sendMessage = sendMessage;
			api.sendAttachment = sendAttachment;
				
			callback(api, event);
		}
		res.sendStatus(200);
		
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
