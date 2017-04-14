/**
 * Handles the middleware of Concierge.
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2017.
 */

const EventEmitter = require('events');

class MiddlewareHandler extends EventEmitter {
    constructor() {
        super();
        this._stacks = {};
        this._anyStack = Symbol('any');
    }

    /**
     * Convinience method for emitting an event asyncronously.
     * @param {string} eventName name of the event.
     * @param {Array<string>} args arguments to pass to the event.
     */
    emitAsync(eventName, ...args) {
        args.unshift(eventName);
        process.nextTick(((args) => {
            this.emit.apply(this, args);
        }).bind(null, args));
    }

    _middlewareRunner(complete, stack, args, asynchronous) {
        if (stack.length === 0) {
            // far more efficient to just execute it
            return complete.apply(this, args);
        }

        const runner = function (complete, stack, args, ...other) {
            const newArgs = other.length > 0 ? [args[0]].concat(other) : args.slice();
            newArgs.push(runner.bind({ index: this.index + 1 }, complete, stack, newArgs.slice()));
            const func = this.index < stack.length ?
                stack[this.index].bind.apply(stack[this.index], newArgs) :
                complete.bind.apply(complete, newArgs.slice(0, newArgs.length - 1));

            return asynchronous ? process.nextTick(func) : func();
        };
        args.unshift(this);
        return runner.call({ index: 0 }, complete, stack, args);
    }

    /**
     * Executes the specified middleware.
     * Each middleware callback is asyncronous.
     * @param {string} name the middleware to execute.
     * @param {function()} complete the function to call when the middleware is complete.
     * @param {Array<>} args the arguments to pass to each successive middleware function.
     */
    runMiddleware(name, complete, ...args) {
        const stack = (this._stacks[name] || []).concat(this._stacks[this._anyStack] || []);
        this._middlewareRunner(complete, stack, args, true);
    }

    /**
     * Executes the specified middleware synchronously.
     * Using this approach may result in an arbitarily large callstack.
     * @param {string} name the middleware to execute.
     * @param {function()} complete the function to call when the middleware is complete.
     * @param {Array<>} args the arguments to pass to each successive middleware function.
     */
    runMiddlewareSync(name, complete, ...args) {
        const stack = (this._stacks[name] || []).concat(this._stacks[this._anyStack] || []);
        return this._middlewareRunner(complete, stack, args, false);
    }

    /**
     * Register middleware which will only run on a named event.
     * @param {string} name name of the event to listen for with this middleware (optional).
     * @param {function()} func function to register.
     * @returns {function()} the function that was registered.
     */
    use(name, func) {
        if (!func) {
            func = name;
            name = this._anyStack;
        }
        if (typeof (func) !== 'function') {
            throw new Error('Middleware must be a function.');
        }

        if (!this._stacks.hasOwnProperty(name)) {
            this._stacks[name] = [];
        }

        this._stacks[name].push(func);
        return func;
    }

    /**
     * Un-register middleware.
     * @param {string} name name of the event to listen for with this middleware (optional).
     * @param {function()} func function to unregister.
     */
    unuse(name, func) {
        if (!func) {
            func = name;
            name = this._anyStack;
        }
        const index = (this._stacks[name] || []).indexOf(func);
        if (index < 0) {
            throw new Error('No such middleware to remove.');
        }
        this._stacks[name].splice(index, 1);
    }
}

module.exports = MiddlewareHandler;
