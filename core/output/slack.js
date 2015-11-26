var request = require('request'),
shim = require('../shim.js'),
socket = require('ws'),
eventemitter3 = require('eventemitter3'),
eventEmitter = new eventemitter3(),
platform = null,
sockets = [],
eventReceivedCallback = null,

sendMessage = function(message, thread) {
	var teamInfo = getChannelIdAndTeamId(thread);

	message.replace('<', '&lt');
	message.replace('>', '&gt');
	message.replace('&', '&amp');

	if (teamInfo.token != null) {
		var body = {
			"token": teamInfo.token,
			"channel": teamInfo.channel_id,
			"username": exports.config.name,
			"link_names": 1,
			"text": message,
			"unfurl_links": true,
			"icon_url": exports.config.icon
		};

		request({
			"uri": 'https://slack.com/api/chat.postMessage',
			"method": 'GET',
			"qs": body
		},
		function (error, response, body) {
			body = JSON.parse(body);
			if (response.statusCode != 200) {
				if (exports.debug) {
					console.error('error: ' + response.statusCode);
				}
			}
			else if (!body.ok) {
				if (exports.debug) {
					console.warn('Failed to send message to channel with id: ' + teamInfo.channel_id + ', error: ' + body.error);
				}
			}
		});
	}
	else {
		if (exports.debug) {
			console.warn('No slack team found!!!');
		}
	}
},

getChannelIdAndTeamId = function(thread) {
	var slackTeams = exports.config.slack_teams,
	thread_components = thread.split('\0', 2),
	channelId = thread_components[0],
	teamId = thread_components[1],
	token = slackTeams[teamId].token;

	return { "channel_id": channelId, "team_id": teamId, "token": token };
},

createThreadId = function(channelId, teamId) {
	return channelId + '\0' + teamId;
}

sendFile = function(type, file, description, thread) {
	var teamInfo = getChannelIdAndTeamId(thread);

	if (teamInfo.token != null) {
		var body = {
			"token": teamInfo.token,
			"channel": teamInfo.channel_id,
			"file": file,
			"filetype": type,
			"title": description
		};

		request({
			"uri": 'https://slack.com/api/files.upload',
			"method": 'GET',
			"qs": body
		},
		function (error, response, body) {
			body = JSON.parse(body);
			if (response.statusCode != 200) {
				if (exports.debug) {
					console.error('error: ' + response.statusCode);
				}
			}
			else if (!body.ok) {
				if (exports.debug) {
					console.warn('Failed send file to channel with id: ' + teamInfo.channel_id + ', error: ' + body.error);
				}
			}
		});
	}
	else {
		if (exports.debug) {
			console.warn('No slack team found!!!');
		}
	}
},

renameChannel = function(title, thread) {
	var teamInfo = getChannelIdAndTeamId(thread);

	if (teamInfo.token != null) {
		var body = {
			"token": teamInfo.token,
			"channel": teamInfo.channel_id,
			"name": title
		};

		request({
			"uri": 'https://slack.com/api/channels.rename',
			"method": 'GET',
			"qs": body
		},
		function (error, response, body) {
			body = JSON.parse(body);
			if (response.statusCode != 200) {
				if (exports.debug) {
					console.error('error: ' + response.statusCode);
				}
			}
			else if (!body.ok) {
				if (exports.debug) {
					console.warn('Failed to rename channel with id: ' + teamInfo.channel_id + ', error: ' + body.error);
				}
			}
		});
	}
	else {
		if (exports.debug) {
			console.warn('No slack team found!!!');
		}
	}
},

sendTyping = function(thread) {
	var slackTeams = exports.config.slack_teams,
	teamInfo = getChannelIdAndTeamId(thread),
	socket = sockets[teamInfo.team_id];

	if (socket != null) {
		var body = {
			"id": slackTeams[teamInfo.team_id].event_id++,
			"channel": teamInfo.channel_id,
			"type": "typing"
		};
		socket.send(JSON.stringify(body));
	}
	else {
		if (exports.debug) {
			console.warn('No socket available for given team id');
		}
	}
},

replaceUserIdWithUserName = function(userName, message, match) {
	if (userName) {
		var index = message.indexOf(match);
		return message.substr(0, index) + userName + message.substr(index + match.length);
	}
},

init = function(token, callback) {
	var body = {
		"token": token,
		mpim_aware: "true"
	};
	request({
		"uri": 'https://slack.com/api/rtm.start',
		"method": 'GET',
		"qs": body
	},
	function (error, response, body) {
		var teamId = null,
		slackTeams = exports.config.slack_teams,
		i = 0,
		team;

		if (!slackTeams) {
			exports.config.slack_teams = {};
			slackTeams = exports.config.slack_teams;
		}

		try {
			body = JSON.parse(body);
		}
		catch(e) {
			if (exports.debug) {
				console.warn("failed to parse message: " + body);
			}
			console.warn("failed to parse message: " + body);
			callback(false);
		}

		if (response.statusCode != 200) {
			if (exports.debug) {
				console.error('error: ' + response.statusCode);
			}
			callback(false);
		}
		else if (!body.ok) {
			if (exports.debug) {
				console.warn('Failed to connect to slack server with token: ' + token + ' error: ' + body.error);
			}
			callback(false);
		}
		else {
			teamId = body.team.id
			slackTeams[teamId] = body;
			team = slackTeams[teamId];
			team.token = token;
			team.event_id = 0;
			team.lastMessageSinceConnection = false,

			//Generate user map
			team.users = generateUserMap(body);
			team.allChannels = generateChannelsMap(body);

			// find slackbot
			findSlackBot(body, team);
			callback({"team_id": teamId, "url": body.url});
		}
	});
},

findSlackBot = function(body, slackTeam) {
	for (var i = 0; i < body.users.length; i++) {
		if (body.users[i].name === 'slackbot') {
			slackTeam.bot_id = body.users[i].id;
			break;
		}
	}
},

generateChannelsMap = function(data) {
	var channels = {};

	for (var i = 0; i < data.channels.length; i++) {
		channels[data.channels[i].id] = data.channels[i];
	}
	for (var j = 0; j < data.groups.length; j++) {
		channels[data.groups[j].id] = data.groups[j];
	}
	for (var k = 0; k < data.ims.length; k++) {
		channels[data.ims[k].id] = data.ims[k];
	}

	return channels;
},

generateUserMap = function(data) {
	var map = {};
	for (var i = 0; i < data.users.length; i++) {
		map[data.users[i].id] = data.users[i];
	}
	return map;
},

connect = function(connectionDetails) {
	var slackTeams = exports.config.slack_teams,
	s;

	if (connectionDetails) {
		(function (connectionDetails) {
			s = new socket(connectionDetails.url);
			sockets[connectionDetails.team_id] = s;
			s.on('open', function() {
				if (exports.debug) {
					console.info("Connection to team: " + slackTeams[connectionDetails.team_id].team.name + " established");
				}
				eventEmitter.emit('open');
			}).on('message', function(data) {
				eventReceived(JSON.parse(data), connectionDetails.team_id);
				eventEmitter.emit('message', data);
			}).on('close', function(data) {
				if (exports.debug) {
					console.info("Disconnected from team: " + slackTeams[connectionDetails.team_id].team.name);
				}
				eventEmitter.emit('close', data);
				init(slackTeams[connectionDetails.team_id].token, connect);
			});
		})(connectionDetails);
	}
	else {
		exports.start(eventReceivedCallback);
	}
},

openPrivateMessage = function(message, thread, senderId) {
	var slackTeams = exports.config.slack_teams,
		teamInfo = getChannelIdAndTeamId(thread);

	if (teamInfo.token != null) {
		var body = {
			"token": teamInfo.token,
			"user": senderId
		};

		request({
			"uri": 'https://slack.com/api/im.open',
			"method": 'GET',
			"qs": body
		},
		function (error, response, body) {
			body = JSON.parse(body);
			if (response.statusCode != 200) {
				if (exports.debug) {
					console.error('error: ' + response.statusCode);
				}
			}
			else if (!body.ok) {
				if (exports.debug) {
					console.warn('Failed to send message to user with id: ' + teamInfo.channel_id + ', error: ' + body.error);
				}
			}
			else {
				slackTeams[teamInfo.team_id].channels[body.channel] = {"channel": body.channel, "user": senderId};
				sendMessage(message, createThreadId(body.channel.id, teamInfo.team_id));
			}
		});
	}
	else {
		if (exports.debug) {
			console.warn('No slack team found!!!');
		}
	}
},

eventReceived = function(event, teamId) {
	switch (event.type) {
		case 'message':
		recMessage(event, teamId);
		break;
		case 'channel_created':
		channelCreated(event, teamId);
		break;
		case 'channel_deleted':
		channelDeleted(event, teamId);
		break;
		case 'channel_rename':
		channelRename(event, teamId);
		break;
		case 'im_created':
		channelCreated(event, teamId);
		break;
		case 'group_joined':
		channelCreated(event, teamId);
		break;
		case 'group_close':
		channelDeleted(event, teamId);
		break;
		case 'group_rename':
		channelRename(event, teamId);
		break;
		case 'user_change':
		userChange(event, teamId);
		break;
		case 'team_join':
		userChange(event, teamId);
		break;
		case 'team_rename':
		teamRename(event, teamId);
		break;
		default:

	}
},

teamRename = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId];
	slackTeam.name = event.name;
},

userChange = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId];
	slackTeam.users[event.user.id] = event.user;
},

channelCreated = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId];
	slackTeam.channels[event.channel.id] = event.channel;
},

channelDeleted = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId];
	removeHelper(slackTeam.channels, event.channel);
},

channelRename = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId];
	slackTeam.channels[event.channel.id].name = event.channel.name;
},

removeHelper = function(object, key) {
	delete object.key;
},

recMessage = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId],
	userName,
	id,
	message = event.text;

	console.log("got message");
	if (!slackTeam.lastMessageSinceConnection) {
		console.log("last message since connection");
		slackTeam.lastMessageSinceConnection = true;
		console.log(event.reply_to);
		if (event.reply_to) {
			console.log("return");
			//throw away this message
			return;
		}
	}

	console.log("continue");
	if (event.user!= slackTeam.bot_id) {
		var matches = event.text.match(/<?@[^:>]+>:?/g);
		if (matches != null) {
			if (slackTeam) {

				for (var j = 0; j < matches.length; j++) {
					// replace identifier with empty string
					id = matches[j].replace(/[ :<>@]+/g, '');

					userName = slackTeam.users[id].name;
					if (!userName) {
						// User not found, this shouldn't happen, but in case it does, Kassy doesn't know who you are.
						message = lookUpUserAddToTeam("Who the hell are you?", message, matches[j]);
						if (exports.debug) {
							console.info("User not found in team, with id: " + id);
						}
					}
					else {
						message = replaceUserIdWithUserName(userName, message, matches[j]);
					}
				}
			}
			else {
				if (exports.debug) {
					console.warn('No slack team found matching: ' + teamId);
				}
			}
		}

		event.body = message;
		event.threadID = createThreadId(event.channel, teamId);
		event.senderID = event.user;
		event.senderName = slackTeam.users[event.user].name;
		shimMessage = shim.createEvent(event.threadID, event.senderID, event.senderName, event.body);
		eventReceivedCallback(platform, shimMessage);
	}
};

exports.start = function (callback) {
	var slackTokens = exports.config.slack_tokens,
	connectionDetails = null;

	eventReceivedCallback = callback;

	if (slackTokens) {
		for (var i = 0; i < slackTokens.length; i++) {
			init(slackTokens[i], connect);
		}

		platform = shim.createPlatformModule({
			sendMessage: sendMessage,
			sendFile: sendFile,
			setTitle: renameChannel,
			sendTyping: sendTyping,
			sendPrivateMessage: openPrivateMessage
		});
	}
	else {
		console.error("Whoops looks like you don't have the slack config set up correctly");
	}
};

exports.stop = function() {
	platform = null;
	for (var socket in sockets) {
		sockets[socket].close();
	}
};
