var request = require('request'),
    WebSocket = require('ws'),
    platform = null,
    sockets = [],
    eventReceivedCallback = null,
    shuttingDown = false,
    recconnetionTimeout = 15000,
    /**
    * Wait time between ping and pong response, in milliseconds.
    */
    defaultPingResponseTimeout = 30000,
    messageQueue = {},
    inTransaction = {},
    waitingForFirstTransaction = {},
    teamData = {},

    sendMessageWebAPI = function (teamId) {
        // Initialise for team
        if (inTransaction[teamId] === null) {
            inTransaction[teamId] = false;
        }

        if (messageQueue[teamId] && messageQueue[teamId].length >= 1 && !inTransaction[teamId]) {
            inTransaction[teamId] = true;
            var message = messageQueue[teamId].shift();
            request({
                uri: message.uri,
                method: 'GET',
                qs: message.body
            },
            function (error, response, body) {
                body = JSON.parse(body);
                if (error) {
                    console.debug('slack-> error: ' + error);
                    message.callback(true, null);
                } else if (!body.ok) {
                    console.debug('slack-> Failed to send message, error: ' + body.error);
                    message.callback(true, null);
                } else if (message.callback) {
                    message.callback(false, body);
                }
                inTransaction[teamId] = false;
                // Wait until message is sent before trying to send another message.
                sendMessageWebAPI(teamId);
            });
        }
    },

    addMessageToQueue = function(teamId, body, uri, callback) {
        waitingForFirstTransaction[teamId] = false;
        if (!messageQueue[teamId]) {
            messageQueue[teamId] = [];
        }
        messageQueue[teamId].push({body: body, uri: uri, callback: callback});
        sendMessageWebAPI(teamId);
    },

    getChannelIdAndTeamId = function(thread) {
        var thread_components = thread.split('\0', 2),
            channelId = thread_components[0],
            teamId = thread_components[1],
            token = teamData[teamId].token;

        return { channel_id: channelId, team_id: teamId, token: token };
    },

    sendMessage = function(message, thread) {
        var teamInfo = getChannelIdAndTeamId(thread);
        var messages = shim._chunkMessage(message, 3500);

        for (var splitMessage of messages) {
            if (teamInfo.token !== null) {
                var body = {
                    token: teamInfo.token,
                    channel: teamInfo.channel_id,
                    username: exports.config.name,
                    link_names: 1,
                    text: splitMessage,
                    unfurl_links: true,
                    icon_url: exports.config.icon
                };
                addMessageToQueue(teamInfo.team_id, body, 'https://slack.com/api/chat.postMessage');
            }
            else {
                console.debug('slack-> No slack team found!!!');
            }
        }
    },

    createThreadId = function(channelId, teamId) {
        return channelId + '\0' + teamId;
    },

    sendFile = function(type, file, description, thread) {
        var teamInfo = getChannelIdAndTeamId(thread);

        if (teamInfo.token !== null) {
            var body = {
                token: teamInfo.token,
                channel: teamInfo.channel_id,
                file: file,
                filetype: type,
                title: description
            };
            addMessageToQueue(teamInfo.team_id, body, 'https://slack.com/api/files.upload');
        }
        else {
            console.debug('slack-> No slack team found!!!');
        }
    },

    renameChannel = function(title, thread) {
        var teamInfo = getChannelIdAndTeamId(thread);

        if (teamInfo.token !== null) {
            var body = {
                token: teamInfo.token,
                channel: teamInfo.channel_id,
                name: title
            };
            addMessageToQueue(teamInfo.team_id, body, 'https://slack.com/api/channels.rename');
        }
        else {
            console.debug('slack-> No slack team found!!!');
        }
    },

    getNextMessageId = function(teamId) {
        return teamData[teamId].event_id++;
    },

    sendSocketMessage = function(type, teamId, body) {
        var socket = sockets[teamId];
        if (socket !== null) {
            switch (type) {
            case 'messsage':
                socket.send(body);
                break;
            case 'ping':
                socket.ping();
                break;
            case 'pong':
                socket.pong();
                break;
            default:
                socket.send(body);
            }
        }
        else {
            console.debug('slack-> No socket available for given team id');
        }
    },

    sendTyping = function(thread) {
        var teamInfo = getChannelIdAndTeamId(thread),
            teamId = teamInfo.team_id,
            body = {
                type:'typing',
                channel: teamInfo.channel_id
            };

        body.id = getNextMessageId(teamId);
        body = JSON.stringify(body);

        console.debug('slack-> send typing indication');
        sendSocketMessage('message', teamId, body);
    },

    replaceUserIdWithUserName = function(userName, message, match) {
        if (userName) {
            var index = message.indexOf(match);
            return message.substr(0, index) + userName + message.substr(index + match.length);
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

    findSlackBot = function(body, slackTeam) {
        for (var i = 0; i < body.users.length; i++) {
            if (body.users[i].name === 'slackbot') {
                slackTeam.bot_id = body.users[i].id;
                break;
            }
        }
    },

    initialiseConnection = function(token, callback) {
        var body = {
            token: token,
            mpim_aware: true
        };
        request({
            uri: 'https://slack.com/api/rtm.start',
            method: 'GET',
            qs: body,
            timeout: 30000
        },
        function (error, response, body) {
            if (error) {
                if (error.connect || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
                    console.debug('slack-> server failed to respond attempting to reconnect');
                    setTimeout(function() {
                        initialiseConnection(token, callback);
                    }, recconnetionTimeout *= 2);
                    return;
                }
                else {
                    console.debug('slack-> failed to Initialise connection: ' + error);
                    callback(false);
                    return;
                }
            }
            var teamId = null,
                team;

            recconnetionTimeout = 15000;
            try {
                body = JSON.parse(body);
            }
            catch (e) {
                console.debug('slack-> failed to parse message: ' + body);
                console.critical(e);
                callback(false);
                return;
            }

            if (response.statusCode !== 200) {
                console.debug('slack-> error: ' + response.statusCode);
                callback(false);
            }
            else if (!body.ok) {
                console.debug('slack-> Failed to connect to slack server with token: ' + token + ' error: ' + body.error);
                callback(false);
            }
            else {
                teamId = body.team.id;
                teamData[teamId] = team = body;
                team.token = token;
                team.event_id = 1;
                team.lastMessageSinceConnection = false;

                // Generate user map
                team.users = generateUserMap(body);
                team.allChannels = generateChannelsMap(body);

                // find slackbot
                findSlackBot(body, team);
                callback({team_id: teamId, url: body.url});
            }
        });
    },

    getTime = function() {
        return new Date().getTime();
    },

    sendPing = function(teamId) {
        var team = teamData[teamId],
            pongId = ++team.pong_id;

        if (!pongId) {
            pongId = team.pong_id = 1;
        }

        sendSocketMessage('ping', teamId);

        team.pongTimeout = setTimeout(function() {
            if (team.pong_id === pongId && !shuttingDown) {
                console.debug('slack-> terminating connection as socket failed to respond to ping request.');
                sockets[teamId].terminate();
                initialiseConnection(team.token, connect);
            }
        }, defaultPingResponseTimeout);
    },

    startPingPongTimer = function(teamId) {
        var team = teamData[teamId],
            messageId = ++team.ping_id;

        if (!messageId) {
            messageId = team.ping_id = 1;
        }

        team.timeSincelastMessageRecieved = getTime();
        team.pingTimeout = setTimeout(function() {
            if (getTime() - team.timeSincelastMessageRecieved >= 60000 && messageId === team.ping_id && !shuttingDown) {
                console.debug('slack-> sending ping');
                sendPing(teamId);
            }
        }, defaultPingResponseTimeout * 2);
    },

    pong = function(teamId) {
        console.debug('slack-> recieved pong');
        teamData[teamId].timeSincelastMessageRecieved = getTime();
        teamData[teamId].pong_id++;
    },

    teamRename = function(event, teamId) {
        teamData[teamId].name = event.name;
    },

    userChange = function(event, teamId) {
        teamData[teamId].users[event.user.id] = event.user;
    },

    channelCreated = function(event, teamId) {
        teamData[teamId].channels[event.channel.id] = event.channel;
    },

    channelDeleted = function(event, teamId) {
        delete teamData[teamId].channels[event.channel];
    },

    channelRename = function(event, teamId) {
        teamData[teamId].channels[event.channel.id].name = event.channel.name;
    },

    recMessage = function(event, teamId) {
        var slackTeam = teamData[teamId],
            userName,
            message = event.text,
            shimMessage;

        if (!slackTeam.lastMessageSinceConnection) {
            slackTeam.lastMessageSinceConnection = true;
            if (event.reply_to) {
                // throw away this message
                return;
            }
        }

        if (event.user !== slackTeam.bot_id) {
            var matches = null,
                lastMatchIndex = -1,
                regex = /<@([^>\|]+)(\|[^>]+)?>:?/;

            if (slackTeam) {
                matches = regex.exec(message);
                while (matches !== null) {
                    if (lastMatchIndex === matches.index) {
                        console.debug('slack-> broken beyond belief. GLHF');
                        break;
                    }
                    lastMatchIndex = matches.index;
                    var match = matches[1];
                    if (match !== null) {
                        userName = slackTeam.users[match].name;
                        if (!userName) {
                            // User not found
                            message = replaceUserIdWithUserName('unknown_user', message, matches[0]);
                            console.debug('slack-> User not found in team, with id: ' + match);
                        }
                        else {
                            message = replaceUserIdWithUserName(userName, message, matches[0]);
                        }
                    }
                    matches = regex.exec(message);
                }
            }
            else {
                console.debug('slack-> No slack team found matching: ' + teamId);
            }

            message = message.replace(/&lt;/g, '<');
            message = message.replace(/&gt;/g, '>');
            message = message.replace(/&amp;/g, '&');

            event.body = message;
            event.threadID = createThreadId(event.channel, teamId);
            event.senderID = event.user;
            event.senderName = slackTeam.users[event.user].name;
            shimMessage = shim.createEvent(event.threadID, event.senderID, event.senderName, event.body);
            eventReceivedCallback(platform, shimMessage);
        }
    },

    eventReceived = function(event, teamId) {
        if (shuttingDown) {
            return;
        }

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
        case 'hello':
            console.debug('slack-> Hello from slack servers');
            break;
        default:
            console.debug('slack-> Message of type ' + event.type + ' not supported');
            break;
        }
    },

    connect = function(connectionDetails) {
        var socket;
        console.debug('slack-> Connecting to socket');

        if (connectionDetails) {
            socket = new WebSocket(connectionDetails.url);
            console.debug(connectionDetails.url);
            sockets[connectionDetails.team_id] = socket;
            socket.on('open', function() {
                console.debug('slack-> Connection to team: ' + teamData[connectionDetails.team_id].team.name + ' established');
            }).on('message', function(data) {
                startPingPongTimer(connectionDetails.team_id);
                eventReceived(JSON.parse(data), connectionDetails.team_id);
            }).on('ping', function() {
                console.debug('slack-> Recieved ping, sending pong');
                sendSocketMessage('pong', connectionDetails.team_id);
            }).on('pong', function() {
                pong(connectionDetails.team_id);
            }).on('close', function() {
                console.debug('slack-> Disconnected from team: ' + teamData[connectionDetails.team_id].team.name);
            }).on('error', function(data) {
                console.debug('slack-> received error:\n' + data);
            });
        }
        else {
            exports.start(eventReceivedCallback);
        }
    },

    openPrivateMessage = function(message, thread, senderId) {
        var teamInfo = getChannelIdAndTeamId(thread);

        if (teamInfo.token !== null) {
            var body = {
                token: teamInfo.token,
                user: senderId
            };

            request({
                uri: 'https://slack.com/api/im.open',
                method: 'GET',
                qs: body
            },
            function (error, response, body) {
                body = JSON.parse(body);
                if (response.statusCode !== 200) {
                    console.debug('slack-> error: ' + response.statusCode);
                }
                else if (!body.ok) {
                    console.debug('slack-> Failed to send message to user with id: ' + teamInfo.channel_id + ', error: ' + body.error);
                }
                else {
                    teamData[teamInfo.team_id].channels[body.channel] = {'channel': body.channel, 'user': senderId};
                    sendMessage(message, createThreadId(body.channel.id, teamInfo.team_id));
                }
            });
        }
        else {
            console.debug('slack-> No slack team found!!!');
        }
    },

    closeSockets = function() {
        console.debug('slack-> closing sockets');
        Object.keys(sockets).forEach(function (element) {
            sockets[element].terminate();
            delete sockets[element];
        });
        sockets = {};
    },

    clearMessageQueue = function() {
        messageQueue = {};
        inTransaction = {};
        waitingForFirstTransaction = {};
    },

    clearTimeouts = function() {
        Object.keys(sockets).forEach(function (team) {
            if (team.pingTimeout) {
                clearTimeout(team.pingTimeout);
                delete team.pingTimeout;
            }

            if (team.pongTimeout) {
                clearTimeout(team.pongTimeout);
                delete team.pongTimeout;
            }
        });
    };

exports.getApi = function() {
    return platform;
};

exports.start = function (callback) {
    var slackTokens = exports.config.slack_tokens;

    shuttingDown = false;
    eventReceivedCallback = callback;

    console.debug('slack-> Starting slack');
    if (slackTokens) {
        for (var i = 0; i < slackTokens.length; i++) {
            initialiseConnection(slackTokens[i], connect);
        }

        platform = shim.createIntegration({
            sendMessage: sendMessage,
            sendFile: sendFile,
            setTitle: renameChannel,
            sendTyping: sendTyping,
            sendPrivateMessage: openPrivateMessage,
            commandPrefix: exports.config.commandPrefix
        });
    }
    else {
        console.debug('slack-> Whoops looks like you don\'t have the slack config set up correctly');
    }
};

exports.stop = function() {
    console.debug('slack-> start shutdown');
    shuttingDown = true;

    // Finish Message queue
    clearMessageQueue();
    // clear timeouts
    clearTimeouts();
    // close sockets
    closeSockets();
};
