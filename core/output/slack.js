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

        for (var i = 0; i < slackTeams.length; i++) {
            if (slackTeams[i].slack_team_id == thread_team_id) {
                slack_token = slackTeams[i].slack_token;
                break;
            }
        }
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
                    var user = {
                        "user_id": body.members[i].id,
                        "user_name": body.members[i].name
                    };
                    userMap.push(user);
                }
                slackTeam.users = userMap;
            }
        });
    };

    lookUpUserAddToTeam = function(slackTeam, userId, matches, message, callback) {
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
                    return callback(matches, message, null);
                }
                else {
                    var user = {
                        "user_id": body.user.id,
                        "user_name": body.user.name
                    };
                    slackTeam.users.push(user);
                    return callback(matches, message, body.user.name);
                }
            });
    };

exports.start = function (callback) {
    var slackTeams = exports.config.slack_teams,
        slack_token = null;
    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    for (var i = 0; i < slackTeams.length; i++) {
        getUsers(slackTeams[i]);
    }

    app.post('/', function (req, res) {
        var data = req.body,
            event = [],
            api = [],
            message = data.text.trim();

        if (data.user_name != 'slackbot') {
            var matches = message.match(/<?@[^:>]+>:?/g);
            if (matches != null) {
                var slackTeams = exports.config.slack_teams,
                    slackTeam,
                    userName,
                    id,
                    foundTeam = false,
                    foundUser = false;

                for (var i = 0; i < slackTeams.length; i++) {
                    if (slackTeams[i].slack_team_id == data.team_id) {
                        slackTeam = slackTeams[i];
                        foundTeam = true;
                        break;
                    }
                }
                if (foundTeam) {

                    id = matches[0].replace(/[ :<>@]+/g, '');

                    for (var l = 0; l < slackTeam.users.length; l++) {
                        if (slackTeam.users[l].user_id == id) {
                            userName = slackTeam.users[l].user_name;
                            foundUser = true;
                            break;
                        }
                    }

                    if (foundUser) {
                        for (var j = 0; j < matches.length; j++) {
                            var index = message.indexOf(matches[j]);
                            message = message.substr(0, index) + userName + message.substr(index + matches[j].length);
                        }
                    }
                    else {
                        // query slack to see if the user is in the team, they may have been added recently
                        message = lookUpUserAddToTeam(slackTeam, id, matches, message, function(matches, message, userName) {

                            if (userName != null) {
                                for (var j = 0; j < matches.length; j++) {
                                    var index = message.indexOf(matches[j]);
                                    message = message.substr(0, index) + userName + message.substr(index + matches[j].length);
                                }
                            }
                            else {
                                return message;
                            }
                        });
                    }
                }
                else {
                    console.log('No slack team found matching: ' + data.team_id);
                }
            }
            else {
                console.log('No match found for: ' + message);
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
