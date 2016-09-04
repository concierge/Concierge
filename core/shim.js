let scopedHttpClient = require('scoped-http-client'),
    sendMessageToMultiple = (message, threads) => {
        let apis = exports.current.getIntegrationApis();
        for (let integ in threads) {
            if (!threads.hasOwnProperty(integ)) {
                continue;
            }
            let intThreads = threads[integ];
            for (let i = 0; i < intThreads.length; i++) {
                apis[integ].sendMessage(message, intThreads[i]);
            }
        }
    };

let IntegrationApi = module.exports = class {
    constructor(prefix) {
        this.commandPrefix = prefix || '/';
        this.sendMessage = IntegrationApi._loopbackWrapper(this.sendMessage, this);
        this.sendUrl = IntegrationApi._loopbackWrapper(this.sendUrl, this);
    }

    sendMessage() {
        throw new Error($$`What kind of shit platform is this that doesn\'t even support sending messages?`);
    }

    sendUrl(url, thread) {
        this.sendMessage(url, thread); // fallback to sending a message
    }

    sendImage(type, image, description, thread) {
        switch(type) {
        case 'url': // fallback to sending a url
            this.sendMessage(description, thread);
            this.sendUrl(image, thread);
            break;
        case 'file': // fallback to sending a file
            this.sendFile(type, image, description, thread);
            break;
        default: // fallback to sending a message
            this.sendMessage(description, thread);
            this.sendMessage($$`I also have something to send you but cant seem to do so...`, thread);
            break;
        }
    }

    sendFile(type, file, description, thread) {
        this.sendMessage(description, thread);
        switch(type) {
        case 'url': // fallback to sending a url
            this.sendUrl(file, thread);
            break;
        case 'file': // fallback to sending a message
            this.sendMessage($$`I have a file to send you but cant seem to do so...`, thread);
            break;
        default: // fallback to sending a message
            this.sendMessage($$`I have something to send you but cant seem to do so...`, thread);
            break;
        }
    }

    sendTyping(thread) {
        this.sendMessage($$`Working on it...`, thread); // fallback to sending a message
    }

    setTitle(title, thread) { // fallback to sending a message
        this.sendMessage($$`If I could set the title of this chat I would set it to "${title}"`, thread);
    }

    sendPrivateMessage(message, thread) {
        this.sendMessage(message, thread);
    }

    sendMessageToMultiple(message, threads) {
        sendMessageToMultiple(message, threads);
    }

    getUsers() {
        return {};
    }

    random(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    http() {
        return scopedHttpClient.create.apply(this, arguments);
    }

    _getBaseClassProperties() {
        let items = Object.getOwnPropertyNames(IntegrationApi.prototype);
        items.splice(items.indexOf('constructor'), 1);
        return items.concat(Object.keys(this));
    }

    static createIntegration(implementation) {
        let integ = new IntegrationApi(implementation.commadPrefix),
            properties = integ._getBaseClassProperties();
        for (let property of properties) {
            if (implementation.hasOwnProperty(property)) {
                integ[property] = implementation[property];
            }
        }
        if (implementation.config && implementation.config.commandPrefix) {
            integ.commandPrefix = implementation.config.commandPrefix;
        }
        return integ;
    }

    static createEvent(thread, senderId, senderName, message) {
        let event = {
            thread_id: thread,
            sender_id: senderId,
            sender_name: senderName + '', // Accept sender_name  = null as a literal
            body: message,
            event_source: null
        };
        event.arguments = event.body.match(/(?:[^\s"]+|"[^"]*")+/g);
        if (event.arguments === null) {
            event.arguments = [''];
        }
        event.arguments_body = event.body.substr(event.arguments[0].length + 1);
        for (let i = 0; i < event.arguments.length; i++) {
            event.arguments[i] = event.arguments[i].replace(/(^["])|(["]$)/g, '');
        }
        return event;
    }

    static _loopbackWrapper(origionalSend, api) {
        return (data, thread) => {
            origionalSend.call(api, data, thread);
            if (exports.current && exports.current.allowLoopback) {
                let newEvent = exports.createEvent(thread, -1, 'Bot', data);
                newEvent.event_source = 'loopback';
                exports.current.onMessage(api, newEvent);
            }
        };
    }
};
