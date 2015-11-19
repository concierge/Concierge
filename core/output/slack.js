var express = require('express'),
	bodyParser  = require("body-parser"),
	request = require('request'),
	app = null,
   	server,
	sendMessage = function(text, thread) {
        var slackTeams = exports.config.slack_teams,
		    	slack_token = null,
          thread_components = thread.split('~', 2),
          thread_id = thread_components[0],
          thread_team_id = thread_components[1];

				slack_token = slackTeam[thread_team_id].slack_token;

        if (slack_token != null) {
            var body = {
                "token": slack_token,
                "channel": thread_id,
                "username": exports.config.name,
                "link_names": 1,
                "text": text
            };

            request({
                    "uri": 'https://slack.com/api/chat.postMessage',
                    "method": 'GET',
                    "qs": body
                },
                function (error, response, body) {
                    if (response.statusCode != 200) {
                        console.log('error: ' + response.statusCode);
                    }
                });
        }
        else {
            console.log('No slack team found!!!');
        }
    },
    getUsers = function(slackTeam) {
        var body = {"token": slackTeam.slack_token},
            userMap = [];
        request({
            "uri": 'https://slack.com/api/users.list',
            "method": 'GET',
            "qs": body
        },
        function (error, response, body) {
					body = JSON.parse(body);
            if (response.statusCode != 200) {
                console.log('error: ' + response.statusCode + '\n' + error);
            }
            else {
                for (var i = 0; i < body.members.length; i++) {
                    userMap[body.members[i].id] = body.members[i].name
                }
                slackTeam.users = userMap;
            }
        });
    },

    lookUpUserAddToTeam = function(slackTeam, userId, match, message, callback) {
        var body = {"token": slackTeam.slack_token, "user": userId},
            userMap = [];
        request({
                "uri": 'https://slack.com/api/users.info',
                "method": 'GET',
                "qs": body
            },
            function (error, response, body) {
                body = JSON.parse(body);
                if (response.statusCode != 200) {
                    console.log('error: ' + response.statusCode + '\n' + error);
                    return message
                }
                else {
                    slackTeam.users[body.user.id] = body.user.name;
                    return callback(body.user.name, message, match);
                }
            });
    },

		replaceUserIdWithUserName = function(userName, message, match) {
			if (userName) {
				var index = message.indexOf(match);
				return message.substr(0, index) + userName + message.substr(index + match.length);
			}
		};



exports.start = function (callback) {
    var slackTeams = exports.config.slack_teams,
        slack_token = null;
    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

		"slack_teams": {
			"team id goes here": {
				"slackToken":  ,
				"users":
			}
		}

    for (teamId in SlackTeams) {
        getUsers(teamId);
    }

    app.post('/', function (req, res) {
        var data = req.body,
            event = [],
            api = [],
            message = data.text.trim();

        if (data.user_name != 'slackbot') {
					// Check that the message sent contains a identifier
					// Fix regex
					// make a lookup table
            var matches = message.match(/<?@[^:>]+>:?/g);
            if (matches != null) {
                var slackTeams = exports.config.slack_teams,
                    slackTeam,
                    userName,
                    id;

								slackTeam = slackTeams[data.team_id];

                if (slackTeam) {

                  for (var j = 0; j < matches.length; j++) {
											// replace identifier with empty string
											id = matches[j].replace(/[ :<>@]+/g, '');

											// find the user
											userName = slackTeam.users[id];
											if (!userName) {
		                      // query slack to see if the user is in the team, they may have been added recently
		                      message = lookUpUserAddToTeam(slackTeam, id, matches[j], message, replaceUserIdWithUserName);
		                  }
											else {
												message = replaceUserIdWithUserName(userName, message, matches[j]);
											}
										}
                }
                else {
                    console.log('No slack team found matching: ' + data.team_id);
                }
            }

            event.body = message;
            event.thread_id = data.channel_id + '~' + data.team_id;
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
    var slackTeams = exports.config.slack_teams;

    //Clean up slack users for each team
    for (var i = 0; i < slackTeams.length; i++) {
        slackTeams[i].users = "";
    }

    server.close();
    server = null;
    app = null;
};
