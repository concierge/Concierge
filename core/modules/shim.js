/**
 * A base integration implementation which handles fallbacks,
 * loopback, middleware and some error checking.
 *
 * Written By:
 *              Matthew Knox
 *
 * License:
 *              MIT License. All code unless otherwise specified is
 *              Copyright (c) Matthew Knox and Contributors 2017.
 */

const scopedHttpClient = require('scoped-http-client'),
    sendMessageToMultiple = (message, threads) => {
        const apis = global.currentPlatform.getIntegrationApis();
        for (let integ in threads) {
            if (!threads.hasOwnProperty(integ)) {
                continue;
            }
            const intThreads = threads[integ];
            for (let i = 0; i < intThreads.length; i++) {
                apis[integ].sendMessage(message, intThreads[i]);
            }
        }
    };

const IntegrationApi = module.exports = class {
    /**
     * constructor - Creates a new integration API.
     *
     * @param  {string} prefix the command prefix for this integration.
     */
    constructor(prefix) {
        this.commandPrefix = prefix || '/';
        this._wrapMethods();
    }

    /**
     * sendMessage - Send a message to a chat.
     *
     * @param  {string} message the message to send.
     * @param  {string} thread  the ID of the thread to send the message to.
     * @example
     * To send 'Hello World' to the current thread:
     * api.sendMessage('Hello World', event.thread_id);
     */
    sendMessage() {
        throw new Error($$`What kind of platform is this that doesn\'t even support sending messages?`);
    }

    /**
     * sendUrl - Embeds a URL within a chat.
     *
     * @param  {string} url    the url to embed.
     * @param  {string} thread the ID of the thread to embed the url in.
     * @example
     * To send 'http://google.com' to the current thread:
     * api.sendUrl('http://google.com', event.thread_id);
     */
    sendUrl(url, thread) {
        this.sendMessage(url, thread); // fallback to sending a message
    }

    /**
     * sendImage - Send an image to a chat.
     *
     * @param  {string} type type of image that is being sent.
     * By default this can be 'url' or 'file' although individual integrations can expand support to other types.
     * @param  {(string|Object)} image image object for the type provided.
     * @param  {string} description description of the image being sent.
     * @param  {string} thread      the ID of the thread to send the image to.
     * @example
     * To send the image 'http://i.imgur.com/unrseYB.png' to the current thread with the description 'Hello World':
     * api.sendImage('url', 'http://i.imgur.com/unrseYB.png', 'Hello World', event.thread_id);
     */
    sendImage(type, image, description, thread) {
        switch (type) {
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

    /**
     * sendFile - Send a file to a chat.
     *
     * @param  {string} type type of file that is being sent.
     * By default this can be 'url' or 'file' although individual integrations can expand support to other types.
     * @param  {(string|Object)} file file object for the type provided.
     * @param  {string} description description of the file being sent.
     * @param  {string} thread       the ID of the thread to send the file to.
     */
    sendFile(type, file, description, thread) {
        this.sendMessage(description, thread);
        switch (type) {
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

    /**
     * sendTyping - starts the self-cancelling typing indicator.
     *
     * Note: typing indicators should be self-cancelling; that is, when this method is called
     * the integration should work out for itself when to stop the typing indicator.
     * For example, this could be done:
     * - on sending a message
     * - after a short timeout (if no message is ever sent)
     *
     * @param  {string} thread the thread ID of the thread to send the typing indicator to.
     * @example
     * To start the typing indicator in the current thread:
     * api.sendTyping(event.thread_id);
     */
    sendTyping(thread) {
        this.sendMessage($$`Working on it...`, thread); // fallback to sending a message
    }

    /**
     * setTitle - sets the title of a chat thread.
     *
     * @param  {string} title  the new title of the thread.
     * @param  {string} thread the thread ID of the thread to set the title of.
     * @example
     * To set the title of the current thread to 'Hello World':
     * api.setTitle('Hello World', event.thread_id);
     */
    setTitle(title, thread) { // fallback to sending a message
        this.sendMessage($$`If I could set the title of this chat I would set it to "${title}"`, thread);
    }

    /**
     * sendPrivateMessage - sends a private message to a person.
     *
     * @param  {string} message message to send.
     * @param  {string} thread  the ID of the person to send the message to.
     * @see {@link sendMessage}
     */
    sendPrivateMessage(message, thread) {
        this.sendMessage(message, thread);
    }

    /**
     * sendMessageToMultiple - sends a message to mutiple loaded integrations.
     * NB: This method should NOT be overridden.
     *
     * @param  {string} message message to send.
     * @param  {Object} threads object representing the threads to send the message to.
     * @example
     * For example, to send the message "Hello World!" to the Facebook threads 1234 and 5678
     * as well as the Slack threads 'abcd' and 'efgh':
     * api.sendMessageToMultiple("Hello World!", {
     *     "facebook": [1234, 5678],
     *     "slack": ['abcd', 'efgh']
     * });
     */
    sendMessageToMultiple(message, threads) {
        sendMessageToMultiple(message, threads);
    }

    /**
     * getUsers - gets the users within a thread.
     *
     * @param  {string} thread thread to get the users of.
     * @return {Object} an object similar to the following:
     * {
     *     '<someUserId>': {
     *         name: '<someUserName>'
     *     }
     * }
     */
    getUsers() {
        return {};
    }

    /**
     * random - convenience method for selecting random items from an array.
     *
     * @param  {Array} arr array to select a random item from.
     * @return {Object} random item of the array.
     * @example
     * let array = ['foo', 'bar', 'baz'];
     * let randomItem = api.random(array); // foo, bar or baz
     */
    random(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * http - convenience method for performing http requests.
     * @see {@link https://github.com/technoweenie/node-scoped-http-client}, client.create for API details.
     * @return {Object} an http.clientRequest.
     */
    http() {
        return scopedHttpClient.create.apply(this, arguments);
    }

    /**
    * _chunkMessage - convenience method for chunking messages.
    * @param {String} message message to chunk.
    * @param {Integer} limit the chunking size.
    * @param {Function} ?callback callback is passed the messages.
    * @return {Array} of messages.
    * @example
    * let text = 'A really long string';
    * let messages = _chunkMessage(text, 5); // ['A ', 'really', ' long', ' stri', 'ng']
    */
    static _chunkMessage(message, limit, callback) {
        const messages = [];
        if (!limit || isNaN(limit) || limit < 1) {
            messages.push(message);
        }
        else {
            while (message.length > limit) {
                let pos = limit - 1,
                    char = message.charAt(pos);

                while (pos > 0 && char !== '\n' && char !== ' ' && char !== '.') {
                    pos--;
                    char = message.charAt(pos);
                }
                if (pos === 0) {
                    pos = limit - 1;
                }
                messages.push(message.slice(0, pos + 1));
                message = message.slice(pos + 1);
            }
            messages.push(message);
        }

        if (callback) {
            callback(messages);
        }
        return messages;
    }

    _getBaseClassProperties() {
        const items = Object.getOwnPropertyNames(IntegrationApi.prototype);
        items.splice(items.indexOf('constructor'), 1);
        return items.concat(Object.keys(this));
    }

    /**
     * createIntegration - creates a new integration based on an object rather than an ES6 class.
     *
     * @param  {Object} implementation implementation of the integration as an object.
     * @return {IntegrationApi} an implementation of the API.
     */
    static createIntegration(implementation) {
        const integ = new IntegrationApi(implementation.commadPrefix),
            properties = integ._getBaseClassProperties();
        for (let property of properties) {
            if (implementation.hasOwnProperty(property)) {
                integ[property] = implementation[property];
            }
        }
        if (implementation.config && implementation.config.commandPrefix) {
            integ.commandPrefix = implementation.config.commandPrefix;
        }
        integ._wrapMethods();
        return integ;
    }

    /**
     * createEvent - creates an event to be passed from an integration to the modules.
     *
     * @param  {string} thread     the ID of the thread that the message was received from.
     * @param  {string} senderId   the ID of the sender of the message.
     * @param  {string} senderName the name of the message sender. This should be a nickname,
     * full name details are retreivable though getUsers. @see {@link getUsers}
     * @param  {string} message    the message string that was received.
     * @return {Object}            an object representing an event.
     */
    static createEvent(thread, senderId, senderName, message) {
        const event = {
            thread_id: thread,
            sender_id: senderId,
            sender_name: senderName + '', // Accept sender_name  = null as a literal
            body: message,
            event_source: null
        };
        event.arguments = event.body.match(/"(?:\\"|[^"])*?"|[^ ]+/g);
        if (event.arguments === null) {
            event.arguments = [''];
        }
        event.arguments_body = event.body.substr(event.arguments[0].length + 1);
        for (let i = 0; i < event.arguments.length; i++) {
            if (event.arguments[i].match(/^".*"$/)) {
                event.arguments[i] = event.arguments[i].replace(/(^["])|(["]$)/g, '');
            }
        }
        return event;
    }

    _wrapMethods() {
        this.sendMessage = IntegrationApi._methodWrapper(this.sendMessage, this);
        this.sendUrl = IntegrationApi._methodWrapper(this.sendUrl, this);
    }

    static _methodWrapper(origionalSend, api) {
        return (data, thread) => {
            if (!thread) {
                throw new Error('A thread must be specified.');
            }
            global.currentPlatform.runMiddleware('after', origionalSend.bind(api), data, thread);
        };
    }
};
