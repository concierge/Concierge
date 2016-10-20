const EventEmitter = require('events');

class MiddlewareHandler extends EventEmitter {
    constructor() {
        super();
        this.stacks = {};
    }

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

        const runner = (function(complete, stack, args, ...other) {
            const index = this.index++;
            if (index < stack.length) {
                process.nextTick(stack[index].bind.apply(stack[index], args));
            }
            else {
                args.pop();
                process.nextTick(complete.bind.apply(complete, args));
            }
        }).bind({ index: 0 }, complete, stack, args);
        args.unshift(this);
        args.push(runner);
        runner();
    }

    runMiddleware(name, complete, ...args) {
        const stack = this.stacks[name] || [];
        this._middlewareRunner(complete, stack, args);
    }

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

    unuse(name, func) {
        const index = (this.stacks[name] || []).indexOf(func);
        if (index < 0) {
            throw new Error('No such middleware to remove.');
        }
        this.stacks[name].splice(index, 1);
    }
}

module.exports = MiddlewareHandler;