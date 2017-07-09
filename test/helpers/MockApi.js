'use strict';

const EventEmitter = require('events');

class MockApi extends EventEmitter {
    _createMockSendMethod (name, len) {
        this._methodCalls[name] = [];
        this[name] = (...args) => {
            if (args.length < len) {
                throw new Error(`Invalid number of arguments passed to ${name}.`);
            }
            this._methodCalls[name].push(args);
            this.emit('message', args);
            this.emit(name, args);
        };
    }

    _runMockReturn (methodName, fallbackCallback, args) {
        if (this._methodReturns[methodName]) {
            return this._methodReturns[methodName].call ?
                this._methodReturns[methodName].value.apply(this, args) :
                this._methodReturns[methodName].value;
        }
        return fallbackCallback();
    }

    setMockReturn (methodName, value, call = false) {
        this._methodReturns[methodName] = {
            value: value,
            call: call
        };
    }

    mockSendToModules (message) {
        if (typeof(message) === 'string') {
            message = MockApi.createEvent('foo', 'bar', 'baz', message);
        }
        global.currentPlatform.onMessage(this, message);
    }

    waitForResponse (callback, done, event = 'message') {
        const cb = args => {
            try {
                callback(args, () => {
                    this.removeListener(event, cb);
                    done();
                });
            }
            catch (e) {
                if (this._opts.printErrors) {
                    LOG.error(e);
                }
            }
        };
        this.on(event, cb);
    }

    waitForResponseAsync (event = 'message') {
        return new Promise(resolve => {
            this.once(event, resolve);
        });
    }

    getUsers (thread) {
        return this._runMockReturn('getUsers', () => {}, [thread]);
    }

    random (arr) {
        return this._runMockReturn('random', () => arr[Math.floor(Math.random() * arr.length)], [arr]);
    }

    http (...args) {
        return this._runMockReturn('http', () => require('scoped-http-client').create.apply(this, args), args);
    }

    constructor (opts) {
        super();
        this._opts = opts || {};
        this.commandPrefix = this._opts.commandPrefix || '/';
        this._waitCallbacks = {};
        this._methodReturns = {};
        this._methodCalls = {};
        this._createMockSendMethod('sendMessage', 2);
        this._createMockSendMethod('sendUrl', 2);
        this._createMockSendMethod('sendImage', 4);
        this._createMockSendMethod('sendFile', 4);
        this._createMockSendMethod('sendTyping', 1);
        this._createMockSendMethod('setTitle', 2);
        this._createMockSendMethod('sendPrivateMessage', 2);
        this._createMockSendMethod('sendMessageToMultiple', 2);
    }

    static createEvent(thread = 'foo', senderId = 'bar', senderName = 'baz', message = 'hello world', source = 'MockApi') {
        const event = {
            thread_id: thread,
            sender_id: senderId,
            sender_name: senderName + '',
            body: message,
            event_source: source
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
}

module.exports = MockApi;
