const Message = require.once('./message.js'),
    Responder = require.once('./responder.js'),
    EventEmitter = require('events'),
    fs = require('fs'),
    path = require('path'),
    http = require('scoped-http-client').create;

class Robot extends EventEmitter {
    constructor(Instance, descriptor, config) {
        super();
        this._descriptor = descriptor;
        this.config = config;
        this.listeners = [];
        this.catchAllListeners = [];
        this.instances = [];
        this.brain = this;
        this.data = this.config;
        this.ignoreHelpContext = true;
        this.logger = console;

        if (!Instance.use) {
            descriptor.type = ['module'];
            this.instances.push(new Instance(this));
        }
        else {
            descriptor.type = ['integration'];
            this.instances.push(Instance);
        }
    }

    users () {
        // Welcome to hack land, where hacks are common place.
        // We access event_source and thread_id from the stack trace so that this is thread safe.
        const origPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        const err = new Error();
        const stack = err.stack;
        Error.prepareStackTrace = origPrepareStackTrace;
        const res = [];
        for (let i = 1; i < stack.length; i++) {
            const funcName = stack[i].getFunctionName() || '';
            if (funcName.startsWith('dataWrapperFunction')) {
                const data = funcName.replace(/\u200d/g, ' ').split('\u200b'),
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
    }

    usersForRawFuzzyName (fuzzyName) {
        const lower = fuzzyName.toLowerCase();
        return this.users().filter(u => u.name.toLowerCase().startsWith(lower));
    }

    usersForFuzzyName (fuzzyName) {
        const lower = fuzzyName.toLowerCase(),
            rawFuzzyName = this.usersForRawFuzzyName(lower),
            ufuzzyName = rawFuzzyName.find(u => u.name.toLowerCase() === lower);
        return ufuzzyName ? [ufuzzyName] : rawFuzzyName;
    }

    userForName (fuzzyName) {
        const lower = fuzzyName.toLowerCase();
        return this.users().find(u => u.name.toLowerCase() === lower) || null;
    }

    userForId (id) {
        return this.users().find(u => u.id === id) || null;
    }

    static generateHubotJson (folderPath, scriptLocation) {
        const hubotDocumentationSections = [
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
            ref = body.split('\n'),
            commands = [];
        let currentSection = null;

        for (let i = 0; i < ref.length; i++) {
            const line = ref[i];
            if (line[0] !== '#' && line.substr(0, 2) !== '//') {
                break;
            }
            const cleanedLine = line.replace(/^(#|\/\/)\s?/, '').trim();
            if (cleanedLine.length === 0 || cleanedLine.toLowerCase() === 'none') {
                continue;
            }

            const nextSection = cleanedLine.toLowerCase().replace(':', '');
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

        const help = [];
        if (scriptDocumentation.commands) {
            for (let i = 0; i < scriptDocumentation.commands.length; i++) {
                const spl = scriptDocumentation.commands[i].match(/(?:[^-]|(?:--[^ ]))+/g);
                if (spl[0].startsWith('hubot ')) {
                    spl[0] = '{{commandPrefix}}' + spl[0].substr(6);
                }
                for (let j = 0; j < spl.length; j++) {
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

        let priority = 'normal';
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
    }

    start (callback) {
        
    }

    stop() {
        
    }

    run (api, event) {
        if (!event.__robotCallbackListeners) {
            return;
        }

        // hack to allow accessing of data via a stacktrace... don't even ask.
        const funcName = ('dataWrapperFunction\u200b' + event.event_source + '\u200b' + event.thread_id).replace(/ /g, '\u200d');
        const wrapper = () => {
            for (let i = 0; i < event.__robotCallbackListeners.length; i++) {
                const responder = new Responder(api, event, event.__robotCallbackListeners[i].match, event.__robotCallbackMessage);
                event.__robotCallbackListeners[i].callback(responder);
            }
        };
        Object.defineProperty(wrapper, "name", { value: funcName });
        wrapper();
    }

    match (event, commandPrefix) {
        if (event.__robotCallbackListeners) {
            delete event.__robotCallbackListeners;
        }

        const msg = new Message(event, commandPrefix);
        for (let i = 0; i < this.listeners.length; i++) {
            const m = this.listeners[i].matcher(msg);
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
            for (let i = 0; i < this.catchAllListeners.length; i++) {
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
    }

    listen (matcher, options, callback) {
        this.listeners.push({
            matcher: matcher,
            callback: callback || options
        });
    }

    hear (regex, options, callback) {
        this.listen((msg) => {
            return msg.event.body.match(regex);
        }, options, callback);
    }

    respond (regex, options, callback) {
        this.listen((msg) => {
            const prefix = msg.prefix.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'),
                reg = eval('/^' + prefix + regex.toString().substring(1));
            return msg.event.body.match(reg);
        }, options, callback);
    }

    messageRoom (room, messages) {
        if (!Array.isArray(messages)) {
            messages = [messages];
        }
        const apis = this.platform.getIntegrationApis();
        for (let api in apis) {
            try { // we have no way of working out which integration this room is on...
                for (let msg of messages) {
                    apis[api].sendMessage(msg, room);
                }
            }
            catch (e) {
                continue; // hope an exception is thrown for an invalid room...
            }
        }
    }

    reply (envelope, messages) {
        let api = this.platform.getIntegrationApis()[envelope.event.event_source],
            resp = new Responder(api, envelope.event, null, messages);
        resp.send(messages);
    }

    catchAll (options, callback) {
        this.listeners.push(options || callback);
    }

    receive (message) {
        const event = shim.createEvent(message.event.thread_id, message.event.sender_id, message.event.sender_name, message.text);
        this.platform.onMessage(api, event);
    }

    help (commandPrefix) {
        const h = [];
        for (let i = 0; i < this._descriptor.help.length; i++) {
            const l = [];
            for (let j = 0; j < this._descriptor.help[i].length; j++) {
                l.push(this._descriptor.help[i][j].replace(/{{commandPrefix}}/g, commandPrefix));
            }
            h.push(l);
        }
        return h;
    }

    loadFile (scriptsPath, script) {
        if (!script) {
            script = scriptsPath;
            scriptsPath = this._descriptor.folderPath;
        }

        if (!Object.keys(require.extensions).includes(script.substring(script.lastIndexOf('.')))) {
            return;
        }

        const p = path.join(scriptsPath, script),
            Instance = require.once(p);
        if (this.instances.length === 1) {
            const hj = Robot.generateHubotJson(scriptsPath, script);
            this._descriptor.help = hj.help;
        }
        this.instances.push(new Instance(this));
    }

    load (scriptsPath) {
        if (!this.loadFile) {
            this.emit('loaded');
            return; // avoid the .load() module call
        }
        try {
            // I wish someone would tell me why existsSync is deprecated...
            if (!fs.lstatSync(scriptsPath).isDirectory()) {
                throw new Error('Load directory must exist.');
            }
            const files = fs.readdirSync(scriptsPath).sort(); // load in same order as hubot
            for (let i = 0; i < files.length; i++) {
                this.loadFile(scriptsPath, files[i]);
            }
        }
        catch (e) {
            console.critical(e);
            return; // nothing to load
        }
    }

    http (...args) {
        http.apply(this, args);
    }
}

module.exports = Robot;