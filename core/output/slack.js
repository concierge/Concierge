var express = require('express'),
	bodyParser  = require("body-parser"),
	request = require('request'),
	app = null,
   	server,
	sendMessage = function(text, thread, teamId) {
        var slackTeams = exports.config.slack_teams
		slack_token = null;
	console.log(teamId);
        for (var i = 0; i < slackTeams.length; i++) {
            if (slackTeams[i].slack_team_id == teamId) {
                slack_token = slackTeams[i].slack_token;
            }
        }
        if (slack_token != null) {
            var body = {
                "token": slack_token,
                "channel": thread,
                "username": exports.config.name,
                "link_names": 1,
                "text": text
            };

            request({
                    "uri": "https://slack.com/api/chat.postMessage",
                    "method": "GET",
                    "qs": body
                },
                function (error, response, body) {
                    if (response.statusCode != 200) {
                        console.log('error: ' + response.statusCode);
                    }
                });
        }
        else {
            console.log("No slack team found!!!");
        }
    };

exports.start = function (callback) {
	app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
	app.post('/', function (req, res) {
		var data = req.body;
		var event = [];
		var api = [];

        console.log(data);
		if (data.user_name != 'slackbot') {
			event.body = data.text.trim();
			event.thread_id = data.channel_id;
            event.team_id = data.team_id;
			event.thread_name = data.channel_name;
			event.timestamp = data.timestamp;
			event.sender_name = data.user_name;
			api.sendMessage = sendMessage;
			api.team_id = data.team_id;
				
			callback(api, event);
		}
		res.sendStatus(200);
		
	});
	server = app.listen(this.config.port);
};

exports.stop = function() {
    server.close();
    server = null;
    app = null;
};
