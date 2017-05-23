const assert = require('chai').assert,
    mockApi = new MockApi();

describe('Test core modules', () => {
    describe('/ping', () => {
        it('should respond on ping', done => {
            mockApi.waitForResponse((args, complete) => {
                assert.include(args[0], 'Concierge', 'Did not recieve the right thing');
                complete();
            }, done);
            mockApi.mockSendToModules('/ping');
        });
    });

    describe('/creator', () => {
        it('should respond with a list of creators', done => {
            mockApi.waitForResponse((args, complete) => {
                assert.include(args[0], 'Matthew', 'Did not recieve the right thing');
                complete();
            }, done);
            mockApi.mockSendToModules('/creator');
        });
    });
});
