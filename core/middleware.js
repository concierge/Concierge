/**
 * Handles the middleware of Concierge.
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2016.
 */

const EventEmitter = require('events');

class MiddlewareHandler extends EventEmitter {
    constructor() {
        super();
        this.stacks = {};
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

    _middlewareRunner(complete, stack, args) {
        if (stack.length === 0) {
            // far more efficient to just execute it
            complete.apply(this, args);
            return;
        }

        const runner = function (complete, stack, args, ...other) {
            let newArgs;
            if (other.length > 0) {
                newArgs = [args[0]].concat(other);
            }
            else {
                newArgs = args.slice();
            }
            newArgs.push(runner.bind({ index: this.index + 1 }, complete, stack, newArgs.slice()));

            if (this.index < stack.length) {
                process.nextTick(stack[this.index].bind.apply(stack[this.index], newArgs));
            }
            else {
                newArgs.pop();
                process.nextTick(complete.bind.apply(complete, newArgs));
            }
        };
        args.unshift(this);
        runner.call({ index: 0 }, complete, stack, args);
    }

    /**
     * Executes the specified middleware.
     * @param {string} name the middleware to execute.
     * @param {function()} complete the function to call when the middleware is complete.
     * @param {Array<>} args the arguments to pass to each successive middleware function.
     */
    runMiddleware(name, complete, ...args) {
        const stack = this.stacks[name] || [];
        this._middlewareRunner(complete, stack, args);
    }

    /**
     * Register middleware.
     * @param {string} name name of the event to listen for with this middleware.
     * @param {function()} func function to register.
     * @returns {function()} the function that was registered.
     */
    use(name, func) {
        if (typeof (func) !== 'function') {
            throw new Error('Middleware must be a function.');
        }

        if (!this.stacks.hasOwnProperty(name)) {
            this.stacks[name] = [];
        }

        this.stacks[name].push(func);
        return func;
    }

    /**
     * Un-register middleware.
     * @param {string} name name of the event to listen for with this middleware.
     * @param {function()} func function to unregister.
     */
    unuse(name, func) {
        const index = (this.stacks[name] || []).indexOf(func);
        if (index < 0) {
            throw new Error('No such middleware to remove.');
        }
        this.stacks[name].splice(index, 1);
    }
}

module.exports = MiddlewareHandler;
