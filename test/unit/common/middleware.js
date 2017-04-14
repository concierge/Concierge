'use strict';

const chai = require('chai');
const assert = chai.assert;
const MiddlewareHandler = c_require('core/common/middleware.js');

class TestMiddlewareHandler extends MiddlewareHandler {
    constructor() {
        super();
        this.val = -1;
    }

    receive(val) {
        this.val = val;
        return val;
    }

    send(val) {
        this.runMiddleware('local', this.receive.bind(this), val);
    }

    sendSync(val) {
        return this.runMiddlewareSync('local', this.receive.bind(this), val);
    }
}

describe('middleware', () => {
    describe('#emitAsync()', () => {
        const middleware = new TestMiddlewareHandler();
        it('should emit an event on next tick', done => {
            middleware.once('test', done);
            middleware.emitAsync('test');
        });

        it('should emit an event on next tick with arguments', done => {
            middleware.once('test', (a, b, c, ...rest) => {
                assert.equal(1, a);
                assert.equal(2, b);
                assert.equal(3, c);
                assert.equal(0, rest.length);
                done();
            });
            middleware.emitAsync('test', 1, 2, 3);
        });
    });

    describe('use middleware', () => {
        it('sync middleware should be able to act as passthrough', () => {
            const middleware = new TestMiddlewareHandler();
            const m = (a, next) => {
                return next();
            };
            middleware.use('local', m);
            assert.equal(1, middleware.sendSync(1));
            middleware.unuse('local', m);
        });

        it('sync middleware should be able to alter arguments', () => {
            const middleware = new TestMiddlewareHandler();
            const m = (a, next) => {
                return next(2);
            };
            middleware.use('local', m);
            assert.equal(2, middleware.sendSync(1));
            middleware.unuse('local', m);
        });

        it('sync middleware should be able to alter return values', () => {
            const middleware = new TestMiddlewareHandler();
            const m = () => {
                return 2;
            };
            middleware.use('local', m);
            assert.equal(2, middleware.sendSync(1));
            middleware.unuse('local', m);
        });

        it('async middleware should be able to act as passthrough', done => {
            const middleware = new TestMiddlewareHandler();
            const m = (a, next) => {
                next();
            };
            middleware.use('local', m);
            middleware.send(5);
            setTimeout(() => {
                assert.equal(5, middleware.val);
                middleware.unuse('local', m);
                done();
            }, 50);
        });

        it('async middleware should be able to alter arguments', done => {
            const middleware = new TestMiddlewareHandler();
            const m = (a, next) => {
                next(7);
            };
            middleware.use('local', m);
            middleware.send(5);
            setTimeout(() => {
                assert.equal(7, middleware.val);
                middleware.unuse('local', m);
                done();
            }, 50);
        });

        it('method should be called with no middleware', () => {
            const middleware = new TestMiddlewareHandler();
            assert.equal(20, middleware.sendSync(20));
        });

        it('global middleware should intercept regardless of event', done => {
            const middleware = new TestMiddlewareHandler();
            const m = (a, next) => {
                next(7);
                middleware.unuse(m);
                done();
            };
            middleware.use(m);
            middleware.send(5);
        });
    });
});
