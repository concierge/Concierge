var request = require('request'),
	shim = require.once('../shim.js'),
	WebSocket = require('ws'),
	deasync = require('deasync'),
	platform = null,
	sockets = [],
	eventReceivedCallback = null,
	numSocketsToShutDown = 0,
	shuttingDown = false;

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
};

getChannelIdAndTeamId = function(thread) {
	var slackTeams = exports.config.slack_teams,
	thread_components = thread.split('\0', 2),
	channelId = thread_components[0],
	teamId = thread_components[1],
	token = slackTeams[teamId].token;

	return { "channel_id": channelId, "team_id": teamId, "token": token };
};

createThreadId = function(channelId, teamId) {
	return channelId + '\0' + teamId;
};

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
};

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
};

sendTyping = function(thread) {
	var slackTeams = exports.config.slack_teams,
	teamInfo = getChannelIdAndTeamId(thread),
	socket = sockets[teamInfo.team_id];

	if (socket != null) {
		var body = {};
			body.id = slackTeams[teamInfo.team_id].event_id++;
			body.type = "typing";
			body.channel = teamInfo.channel_id;

		console.log("typing");
		console.log(JSON.stringify(body));
		socket.send(JSON.stringify(body));
	}
	else {
		if (exports.debug) {
			console.warn('No socket available for given team id');
		}
	}
};

replaceUserIdWithUserName = function(userName, message, match) {
	if (userName) {
		var index = message.indexOf(match);
		return message.substr(0, index) + userName + message.substr(index + match.length);
	}
};

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
			teamId = body.team.id;
			slackTeams[teamId] = body;
			team = slackTeams[teamId];
			team.token = token;
			team.event_id = 0;
			team.lastMessageSinceConnection = false;

			//Generate user map
			team.users = generateUserMap(body);
			team.allChannels = generateChannelsMap(body);

			// find slackbot
			findSlackBot(body, team);
			callback({"team_id": teamId, "url": body.url});
		}
	});
};

findSlackBot = function(body, slackTeam) {
	for (var i = 0; i < body.users.length; i++) {
		if (body.users[i].name === 'slackbot') {
			slackTeam.bot_id = body.users[i].id;
			break;
		}
	}
};

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
};

generateUserMap = function(data) {
	var map = {};
	for (var i = 0; i < data.users.length; i++) {
		map[data.users[i].id] = data.users[i];
	}
	return map;
};

connect = function(connectionDetails) {
	var slackTeams = exports.config.slack_teams,
	s;
	console.log("connect");

	if (connectionDetails) {
		(function (connectionDetails) {
			console.log(Object.keys(sockets));
			s = new WebSocket(connectionDetails.url);
			console.log(connectionDetails.url);
			sockets[connectionDetails.team_id] = s;
			console.log(Object.keys(sockets));
			s.on('open', function() {
				console.log("openned");
				if (exports.debug) {
					console.info("Connection to team: " + slackTeams[connectionDetails.team_id].team.name + " established");
				}
			}).on('message', function(data) {
				console.log("got message");
				eventReceived(JSON.parse(data), connectionDetails.team_id);
			}).on('close', function(data) {
				console.log("received close event");
				if (exports.debug) {
					console.info("Disconnected from team: " + slackTeams[connectionDetails.team_id].team.name);
				}
				 //if (numSocketsToShutDown > 0) {
				 //	numSocketsToShutDown--;
				 //	console.log("shutdown socket close");
				 //	return;
				 //}
				console.log("normal close");
				if (!shuttingDown) {
					//init(slackTeams[connectionDetails.team_id].token, connect);
				}
			}).on('error', function(data) {
				console.log("received error");
				console.log(data);
			});
		})(connectionDetails);
	}
	else {
		exports.start(eventReceivedCallback);
	}
};

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
};

eventReceived = function(event, teamId) {
	if (shuttingDown) return;
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
};

teamRename = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId];
	slackTeam.name = event.name;
};

userChange = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId];
	slackTeam.users[event.user.id] = event.user;
};

channelCreated = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId];
	slackTeam.channels[event.channel.id] = event.channel;
};

channelDeleted = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId];
	removeHelper(slackTeam.channels, event.channel);
};

channelRename = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId];
	slackTeam.channels[event.channel.id].name = event.channel.name;
};

removeHelper = function(object, key) {
	delete object.key;
};

recMessage = function(event, teamId) {
	var slackTeam = exports.config.slack_teams[teamId],
		userName,
		id,
		message = event.text,
		shimMessage;

	console.log("got message");
	console.log(slackTeam.lastMessageSinceConnection);
	console.log(message);
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
		var matches = null,
			lastMatchIndex = -1,
			regex = /<@([^>\|]+)(\|[^>]+)?>:?/;

		if (slackTeam) {
			matches = regex.exec(message);
			while (matches !== null) {
				if (lastMatchIndex === matches.index) {
					console.log("broken beyond belief");
					break;
				}
				lastMatchIndex = matches.index;
				console.log(matches);
				var match = matches[1];
				if (match != null) {
					userName = slackTeam.users[match].name;
					console.log(userName);
					if (!userName) {
						// User not found, this shouldn't happen, but in case it does, Kassy doesn't know who you are so lets call you "Bob"
						message = replaceUserIdWithUserName("Bob", message, matches[0]);
						if (exports.debug) {
							console.info("User not found in team, with id: " + match);
						}
					}
					else {
						message = replaceUserIdWithUserName(userName, message, matches[0]);
					}
				}
				console.log(message);
				matches = regex.exec(message);
				console.log(matches);
			}
		}
		else {
			if (exports.debug) {
				console.warn('No slack team found matching: ' + teamId);
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

closeSockets = function() {
	console.log("closing sockets");
	Object.keys(sockets).forEach(function (element, index) {
		sockets[element].terminate();
		numSocketsToShutDown--;
	});
	sockets = {};
	console.log("sockets closed");
};

exports.start = function (callback) {
	var slackTokens = exports.config.slack_tokens;

	shuttingDown = false;
	eventReceivedCallback = callback;
	numSocketsToShutDown = 0;

	console.log("starting");
	if (slackTokens) {
		for (var i = 0; i < slackTokens.length; i++) {
			init(slackTokens[i], connect);
		}

		platform = shim.createPlatformModule({
			sendMessage: sendMessage,
			sendFile: sendFile,
			setTitle: renameChannel,
			sendTyping: sendTyping,
			sendPrivateMessage: openPrivateMessage,
			commandPrefix: exports.config.commandPrefix
		});
	}
	else {
		console.error("Whoops looks like you don't have the slack config set up correctly");
	}
};

exports.stop = function() {
	console.log("start shutdown");
	shuttingDown = true;
	numSocketsToShutDown = Object.keys(sockets).length;
	closeSockets();
	deasync.loopWhile(function() {
		return numSocketsToShutDown > 0;
	});
	console.log("end shutdown");
};
