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

    this.brain = {
        on: function(event, callback) {
            if (event === 'loaded') {
                callback();
            }
        },
        emit: function() {},
        data: config
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
        ref = body.split("\n"),
        commands = [];

    for (var i = 0; i < ref.length; i++) {
        var line = ref[i];
        if (line[0] !== '#' && line.substr(0, 2) !== '//') {
            break;
        }
        var cleanedLine = line.replace(/^(#|\/\/)\s?/, "").trim();
        if (cleanedLine.length === 0 || cleanedLine.toLowerCase() === 'none') {
            continue;
        }

        var nextSection = cleanedLine.toLowerCase().replace(':', '');
        if (hubotDocumentationSections.indexOf(nextSection) >= 0) {
            currentSection = nextSection;
            scriptDocumentation[currentSection] = [];
        } else if (currentSection) {
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
        help.push([scriptDocumentation.name, "Does something. The unhelpful author didn't specify what."]);
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
        help: help
    };
};

Robot.prototype.run = function (api, event) {
    if (!event.__robotCallbackListeners) {
        return;
    }

    for (var i = 0; i < event.__robotCallbackListeners.length; i++) {
        var responder = new Responder(api, event, event.__robotCallbackListeners[i].match, event.__robotCallbackMessage);
        event.__robotCallbackListeners[i].callback(responder);
    }
};

Robot.prototype.match = function (event, commandPrefix) {
    var msg = new Message(event, commandPrefix);

    var hasMatched = false;
    for (var i = 0; i < this.listeners.length; i++) {
        var m = this.listeners[i].matcher(msg);
        if (m) {
            hasMatched = true;
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

    if (!hasMatched) {
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
            var prefix = msg.prefix.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            var reg = eval('/^' + prefix + regex.toString().substring(1));
            return msg.event.body.match(reg);
        },
        callback: callback
    });
};

Robot.prototype.catchAll = function (callback) {
    this.listeners.push(callback);
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

module.exports = Robot;
