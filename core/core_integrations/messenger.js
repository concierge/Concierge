var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    https = require('https'),
    http = null,
    api = null,

    getNameForId = function(id, callback) {
        if (!exports.config.users) {
            exports.config.users = {};
        }

        if (exports.config.users[id]) {
            return callback(exports.config.users[id].name);
        }

        request({
            url: 'https://graph.facebook.com/v2.6/' + id,
            qs: {access_token: exports.config.token, fields: 'first_name,last_name'},
            method: 'GET'
        },
        function(error, response, body) {
            if (error) {
                return callback('UnknownUser');
            }
            body = JSON.parse(body);
            if (!exports.config.users[id]) {
                exports.config.users[id] = {};
            }
            exports.config.users[id].name = body.first_name + ' ' + body.last_name;
            callback(exports.config.users[id].name);
        });
    },

    sentenceSplitter = function(message) {
        var spl = message.split('\n');

        for (var i = 0; i < spl.length; i++) {
            var strs = [];
            while (spl[i].length > 0) {
                var str = spl[i].substr(0, 320);
                var ind = str.lastIndexOf(' ');
                if (ind >= 0 && str.length !== spl[i].length) {
                    str = str.substr(0, Math.min(str.length, ind + 1));
                }

                strs.push(str);
                spl[i] = spl[i].substr(str.length);
            }
            spl.splice(i, 1);
            for (var j = 0; j < strs.length; j++) {
                spl.splice(i + j, 0, strs[j]);
            }
            i += strs.length;
        }

        for (var i = 0; i < spl.length; i++) {
            var curr = spl[i];
            for (var j = i + 1; j < spl.length; j++) {
                if (curr + spl[j] + 1 < 320) {
                    curr += '\n' + spl[j];
                    spl.splice(j, 1);
                }
                else {
                    break;
                }
            }
            spl[i] = curr;
        }

        return spl;
    },

    genericMessageRequest = function(message, recipientId, callback) {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: exports.config.token},
            method: 'POST',
            json: {
                recipient: {id: recipientId},
                message: message
            }
        },
        function(error) {
            if (error) {
                throw error;
            }
            if (callback) {
                callback();
            }
        });
    },

    listGenericMessageRequest = function(list, property, threadId) {
        if (!list || list.length <= 0) {
            return;
        }
        var arg = {};
        arg[property] = list[0];
        list.splice(0, 1);
        genericMessageRequest(arg, threadId, listGenericMessageRequest.bind(this, list, property, threadId));
    };

exports.getApi = function() {
    return api;
};

exports.start = function(callback) {
    api = shim.createIntegration({
        sendMessage: function (message, threadId) {
            var spl = sentenceSplitter(message);
            listGenericMessageRequest(spl, 'text', threadId);
        },
        getUsers: function() {
            return exports.config.users || {};
        },
        sendImage: function(type, image, description, thread) {
            if (description) {
                this.sendMessage(description, thread);
            }
            switch (type) {
                case 'url':
                    genericMessageRequest({
                        attachment: {
                            type: 'image',
                            payload: {
                                url: image
                            }
                        }
                    }, thread);
                    break;
                case 'file':
                    genericMessageRequest({
                        attachment: {
                            type: 'image',
                            payload: image
                        }
                    }, thread);
                    break;
            }
        },
        sendPrivateMessage: this.sendMessage,
        commandPrefix: exports.config.commandPrefix
    });

    var app = express();
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    var port = exports.config.port;
    if (exports.config.cert && exports.config.ca && exports.config.key) {
        var sslOpts = {
            key: fs.readFileSync(path.resolve(exports.config.key), 'utf8'),
            cert: fs.readFileSync(path.resolve(exports.config.cert), 'utf8'),
            ca: fs.readFileSync(path.resolve(exports.config.ca), 'utf8')
        };
        http = https.createServer(sslOpts, app);
        port = port || 443;
    }
    else {
        http = require('http').createServer(app);
        port = port || 80;
    }

    http.listen(port);

    app.get('/', (req, res) => {
        res.send('Invalid Request');
    });

    // Verify Webhook
    app.get('/webhook', function (req, res) {
        if (req.query['hub.verify_token'] === exports.config.verify) {
            res.send(req.query['hub.challenge']);
        } else {
            res.send('Invalid verify token');
        }
    });

    // Received Post
    app.post('/webhook', function (req, res) {
        res.sendStatus(200);
        var msg = req.body.entry[0],
            userId = msg.messaging[0].sender.id;

        if (!msg.messaging[0].message) {
            return;
        }

        getNameForId(userId, function(name) {
            var event = shim.createEvent(userId, userId, name, msg.messaging[0].message.text + '');
            callback(api, event);
        });
    });
};

exports.stop = function() {
    http.close();
};
