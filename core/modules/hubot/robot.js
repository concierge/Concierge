var Message = require.once('./message.js'),
    Responder = require.once('./responder.js'),
    fs = require('fs'),
    path = require('path');

var Robot = function(Instance, descriptor, config) {
    this.name = descriptor.name;
    this._help = descriptor.help;
    this.folderPath = descriptor.folderPath;

    this.listeners = [];
    this.catchAllListeners = [];
    this.instances = [];

    let self = this;
    this.brain = {
        on: function(event, callback) {
            if (event === 'loaded') {
                callback();
            }
        },
        emit: function() {},
        data: config,
        users: function () {
            // Welcome to hack land, where hacks are common place.
            // We access event_source and thread_id from the stack trace so that this is thread safe.
            const origPrepareStackTrace = Error.prepareStackTrace;
            Error.prepareStackTrace = function(_, stack) {
                return stack;
            };
            const err = new Error();
            const stack = err.stack;
            Error.prepareStackTrace = origPrepareStackTrace;
            let res = [];
            for (let i = 1; i < stack.length; i++) {
                let funcName = stack[i].getFunctionName() || "";
                if (funcName.startsWith('dataWrapperFunction')) {
                    let data = funcName.replace(/\u200d/g, ' ').split('\u200b'),
                        users = this.platform.getIntegrationApis()[data[1]].getUsers(data[2]);
                    for (let id in users) {
                        res.push({
                            name: users[id].name,
                            id: id,
                            email_address: 'unknown@unknown.unknown'
                        });
                    }
                    break;
                }
            }
            return res;
        }.bind(self),
        usersForRawFuzzyName: function(fuzzyName) {
            let users = this.users(),
                lower = fuzzyName.toLowerCase();
            for (let i = 0; i < users.length; i++) {
                if (!users[i].name.toLowerCase().startsWith(lower)) {
                    users.splice(i, 1);
                    i--;
                }
            }
            return users;
        },
        usersForFuzzyName: function(fuzzyName) {
            let rawFuzzyName = this.usersForRawFuzzyName(fuzzyName),
                lower = fuzzyName.toLowerCase();
            for (let i = 0; i < rawFuzzyName.length; i++) {
                if (rawFuzzyName[i].name.toLowerCase() === lower) {
                    return [rawFuzzyName[i]];
                }
            }
            return rawFuzzyName;
        },
        userForName: function (fuzzyName) {
            let users = this.users(),
                lower = fuzzyName.toLowerCase();
            for (let i = 0; i < users.length; i++) {
                if (users[i].name.toLowerCase() === lower) {
                    return users[i];
                }
            }
            return null;
        },
        userForId: function (id) {
            let users = this.users();
            for (let i = 0; i < users.length; i++) {
                if (users[i].id === id) {
                    return users[i];
                }
            }
            return null;
        }
    };

    this.instances.push(new Instance(this));
};

Robot.generateHubotJson = function (folderPath, scriptLocation) {
    var hubotDocumentationSections = [
            'description',
            'dependencies',
            'configuration',
            'commands',
            'notes',
            'author',
            'authors',
            'examples',
            'tags',
            'urls'
        ],
        mod = path.join(folderPath, scriptLocation),
        body = fs.readFileSync(mod, 'utf-8'),
        scriptDocumentation = { name: path.basename(mod).replace(/\.(coffee|js)$/, '') },
        currentSection = null,
        ref = body.split('\n'),
        commands = [];

    for (var i = 0; i < ref.length; i++) {
        var line = ref[i];
        if (line[0] !== '#' && line.substr(0, 2) !== '//') {
            break;
        }
        var cleanedLine = line.replace(/^(#|\/\/)\s?/, '').trim();
        if (cleanedLine.length === 0 || cleanedLine.toLowerCase() === 'none') {
            continue;
        }

        var nextSection = cleanedLine.toLowerCase().replace(':', '');
        if (hubotDocumentationSections.indexOf(nextSection) >= 0) {
            currentSection = nextSection;
            scriptDocumentation[currentSection] = [];
        }
        else if (currentSection) {
            scriptDocumentation[currentSection].push(cleanedLine.trim());
            if (currentSection === 'commands') {
                commands.push(cleanedLine.trim());
            }
        }
    }

    var help = [];
    if (scriptDocumentation.commands) {
        for (var i = 0; i < scriptDocumentation.commands.length; i++) {
            var spl = scriptDocumentation.commands[i].match(/(?:[^-]|(?:--[^ ]))+/g);
            if (spl[0].startsWith('hubot ')) {
                spl[0] = '{{commandPrefix}}' + spl[0].substr(6);
            }
            for (var j = 0; j < spl.length; j++) {
                spl[j] = spl[j].trim();
            }
            if (spl.length === 1) {
                spl.push('Does what the command says.');
            }
            help.push(spl);
        }
    }

    if (help.length === 0) {
        help.push([scriptDocumentation.name, $$`Does something. The unhelpful author didn't specify what.`]);
    }

    var priority = 'normal';
    if (body.indexOf('.catchAll') >= 0) {
        priority = 'last';
    }

    return {
        name: scriptDocumentation.name,
        startup: scriptLocation,
        version: 1.0,
        dependencies: scriptDocumentation.dependencies,
        configuration: scriptDocumentation.configuration,
        notes: scriptDocumentation.notes,
        authors: scriptDocumentation.authors || scriptDocumentation.author,
        examples: scriptDocumentation.examples,
        tags: scriptDocumentation.tags,
        urls: scriptDocumentation.urls,
        help: help,
        priority: priority
    };
};

Robot.prototype.run = function (api, event) {
    if (!event.__robotCallbackListeners) {
        return;
    }

    // hack to allow accessing of data via a stacktrace... don't even ask.
    let funcName = ('dataWrapperFunction\u200b' + event.event_source + '\u200b' + event.thread_id).replace(/ /g, '\u200d');
    var wrapper = function() {
        for (let i = 0; i < event.__robotCallbackListeners.length; i++) {
            let responder = new Responder(api, event, event.__robotCallbackListeners[i].match, event.__robotCallbackMessage);
            event.__robotCallbackListeners[i].callback(responder);
        }
    };
    Object.defineProperty(wrapper, "name", { value: funcName });
    wrapper();
};

Robot.prototype.match = function (event, commandPrefix) {
    if (event.__robotCallbackListeners) {
        delete event.__robotCallbackListeners;
    }

    var msg = new Message(event, commandPrefix);

    for (var i = 0; i < this.listeners.length; i++) {
        var m = this.listeners[i].matcher(msg);
        if (m) {
            if (!event.__robotCallbackListeners) {
                event.__robotCallbackListeners = [];
                event.__robotCallbackMessage = msg;
            }
            event.__robotCallbackListeners.push({
                callback: this.listeners[i].callback,
                match: m
            });
        }
    }

    if (event.module_match_count === 0) {
        for (var i = 0; i < this.catchAllListeners.length; i++) {
            if (!event.__robotCallbackListeners) {
                event.__robotCallbackListeners = [];
                event.__robotCallbackMessage = msg;
            }
            event.__robotCallbackListeners.push({
                callback: this.catchAllListeners[i],
                match: null
            });
        }
    }

    return !!event.__robotCallbackListeners;
};

Robot.prototype.listen = function (matcher, callback) {
    this.listeners.push({
        matcher: matcher,
        callback: callback
    });
};

Robot.prototype.hear = function (regex, callback) {
    this.listeners.push({
        matcher: function (msg) {
            return msg.event.body.match(regex);
        },
        callback: callback
    });
};

Robot.prototype.respond = function (regex, callback) {
    this.listeners.push({
        matcher: function (msg) {
            var prefix = msg.prefix.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
            var reg = eval('/^' + prefix + regex.toString().substring(1));
            return msg.event.body.match(reg);
        },
        callback: callback
    });
};

Robot.prototype.catchAll = function (callback) {
    this.listeners.push(callback);
};

Robot.prototype.receive = function (message) {
    var event = shim.createEvent(message.event.thread_id, message.event.sender_id, message.event.sender_name, message.text);
    this.platform.onMessage(api, event);
};

Robot.prototype.ignoreHelpContext = true;

Robot.prototype.help = function (commandPrefix) {
    var h = [];
    for (var i = 0; i < this._help.length; i++) {
        var l = [];
        for (var j = 0; j < this._help[i].length; j++) {
            l.push(this._help[i][j].replace(/{{commandPrefix}}/g, commandPrefix));
        }
        h.push(l);
    }
    return h;
};

Robot.prototype.logger = {
    error: console.error,
    warning: console.warn,
    info: console.info,
    debug: console.debug
};

Robot.prototype.loadFile = function (scriptsPath, script) {
    if (!script) {
        script = scriptsPath;
        scriptsPath = this.folderPath;
    }

    if (!Object.keys(require.extensions).includes(script.substring(script.lastIndexOf('.')))) {
        return;
    }

    var p = path.join(scriptsPath, script),
        Instance = require.once(p);
    if (this.instances.length === 1) {
        var hj = Robot.generateHubotJson(scriptsPath, script);
        this._help = hj.help;
    }
    this.instances.push(new Instance(this));
};

Robot.prototype.http = require('scoped-http-client').create;

module.exports = Robot;
