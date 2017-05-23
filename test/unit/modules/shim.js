'use strict';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const IntegrationApi = c_require('core/modules/shim.js');
global.grunt$$ = (strings, ...values) => strings.map((v, i) => [v, values[i]]).reduce((a, b) => a.concat(b));

describe('shim', () => {
    const instance = new IntegrationApi('!');

    describe('#constructor()', () => {
        it('should fallback to "/" when a prefix isnt provided', () => {
            const instance1 = new IntegrationApi();
            const instance2 = new IntegrationApi('');
            const instance3 = new IntegrationApi(null);
            const instance4 = new IntegrationApi(void(0));
            assert.equal('/', instance1.commandPrefix);
            assert.equal('/', instance2.commandPrefix);
            assert.equal('/', instance3.commandPrefix);
            assert.equal('/', instance4.commandPrefix);
        });

        it('should use prefix when provided', () => {
            assert.equal('!', instance.commandPrefix);
        });
    });

    describe('#getUsers()', () => {
        it('should return an empty object, regardless of thread', () => {
            assert.deepEqual({}, instance.getUsers());
            assert.deepEqual({}, instance.getUsers(null));
            assert.deepEqual({}, instance.getUsers(void(0)));
            assert.deepEqual({}, instance.getUsers(''));
            assert.deepEqual({}, instance.getUsers('foo'));
        });
    });

    describe('#sendImage()', () => {
        it('should return an empty object, regardless of thread', () => {
            assert.deepEqual({}, instance.getUsers());
            assert.deepEqual({}, instance.getUsers(null));
            assert.deepEqual({}, instance.getUsers(void (0)));
            assert.deepEqual({}, instance.getUsers(''));
            assert.deepEqual({}, instance.getUsers('foo'));
        });
    });

    describe('#sendMessageToMultiple()', () => {
        expect(() => instance.sendMessageToMultiple('foo', {
            grunt: ['grunt']
        })).to.throw(grunt$$`What kind of platform is this that doesn\'t even support sending messages?`);
    });

    describe('#random()', () => {
        it('should always return an item within a valid array', () => {
            const items = ['abc', 1, 5, 'blah', 4];
            for (let i = 0; i < 1000; i++) {
                const res = instance.random(items);
                assert.isTrue(items.includes(res));
            }
        });

        it('should return undefined if the array is empty', () => {
            assert.equal(void(0), instance.random([]));
        });
    });

    const generateBaseTest = (methodName, ...args) => {
        return () => {
            expect(() => instance[methodName].apply(instance, args)).to.throw('A thread must be specified.');
            expect(() => instance[methodName].apply(instance, args.concat('bar'))).to.throw(grunt$$`What kind of platform is this that doesn\'t even support sending messages?`);
        };
    };

    // as shim acts like an abstract implementation, we can only test the base implementation of these features
    describe('#sendMessage()', generateBaseTest('sendMessage', 'foo'));
    describe('#sendUrl()', generateBaseTest('sendUrl', 'foo'));
    describe('#sendTyping()', generateBaseTest('sendTyping'));
    describe('#setTitle()', generateBaseTest('setTitle', 'foo'));
    describe('#sendPrivateMessage()', generateBaseTest('sendPrivateMessage', 'foo'));

    describe('#sendImage()', generateBaseTest('sendImage', 'url', 'http://foo.bar/image.jpg', ''));
    describe('sendImageWithDescription', generateBaseTest('sendImage', 'url', 'http://foo.bar/image.jpg', 'with description'));
    describe('sendImageFile', generateBaseTest('sendImage', 'file', {}, ''));
    describe('sendImageFileWithDescription', generateBaseTest('sendImage', 'file', {}, 'with description'));
    describe('sendImageUnknown', generateBaseTest('sendImage', 'foo', {}, ''));
    describe('sendImageUnknownWithDescription', generateBaseTest('sendImage', 'foo', {}, 'with description'));

    describe('#sendFile()', generateBaseTest('sendFile', 'url', 'http://foo.bar/file.ext', ''));
    describe('sendFileWithDescription', generateBaseTest('sendFile', 'url', 'http://foo.bar/file.ext', 'with description'));
    describe('sendFileFile', generateBaseTest('sendFile', 'file', {}, ''));
    describe('sendFileFileWithDescription', generateBaseTest('sendFile', 'file', {}, 'with description'));
    describe('sendFileUnknown', generateBaseTest('sendFile', 'foo', {}, ''));
    describe('sendFileUnknownWithDescription', generateBaseTest('sendFile', 'foo', {}, 'with description'));

    describe('#_chunkMessage()', () => {
        const text = 'A really long string';
        it('should sensibly chunk a message where possible', () => {
            const messages = IntegrationApi._chunkMessage(text, 6);
            assert.deepEqual(['A ', 'really', ' long ', 'string'], messages);
        });

        it('should return the entire message if an invalid limit is set', () => {
            assert.deepEqual(['A really long string'], IntegrationApi._chunkMessage(text, Number.NaN));
            assert.deepEqual(['A really long string'], IntegrationApi._chunkMessage(text));
            assert.deepEqual(['A really long string'], IntegrationApi._chunkMessage(text, 0));
            assert.deepEqual(['A really long string'], IntegrationApi._chunkMessage(text, -50));
        });
    });

    describe('#createIntegration()', () => {
        let receivedMessage = 0;
        const integ = {
            commandPrefix: '$',
            sendMessage: () => receivedMessage++
        };
        const api = IntegrationApi.createIntegration(integ);

        it('should have assigned the correct prefix', () => {
            assert.equal('$', api.commandPrefix);
        });

        expect(() => api.sendMessage('test')).to.throw('A thread must be specified.');

        it('should call the overridden method', () => {
            const before = receivedMessage;
            api.sendMessage('Hello World', 'foo');
            assert.equal(before + 1, receivedMessage);
        });
    });

    describe('#createEvent()', () => {
        const rxdMessage = '/hello world "this is a test" comma"nd foo"';
        const event = IntegrationApi.createEvent('thread', 'senderId', 'myName', rxdMessage);

        it('should split message into arguments', () => {
            assert.deepEqual(['/hello', 'world', 'this is a test', 'comma"nd', 'foo"'], event.arguments);
        });

        it('should keep quoted strings as single arguments', () => {
            assert.isTrue(event.arguments.includes('this is a test'));
            assert.isFalse(event.arguments.includes('comma"nd foo"'));
        });

        it('should strip quotes from quoted string arguments', () => {
            assert.isFalse(event.arguments.includes('"this is a test"'));
        });

        it('should set the thread_id', () => {
            assert.equal('thread', event.thread_id);
        });

        it('should set the sender_id', () => {
            assert.equal('senderId', event.sender_id);
        });

        it('should set the sender_name', () => {
            assert.equal('myName', event.sender_name);
        });

        it('should treat null as "null" for sender_name', () => {
            const event2 = IntegrationApi.createEvent('thread', 'senderId', null, rxdMessage);
            assert.equal('null', event2.sender_name);
        });

        it('should set the body', () => {
            assert.equal(rxdMessage, event.body);
        });

        it('should initialise the source', () => {
            assert.equal(null, event.event_source);
        });
    });
});
