var assert = require('chai').assert,
    c = require('../client.js');

describe('Test core modules', function() {
    this.timeout(5000);
    before(function(done) {
        client = new c(done);
    });

    after(function(done) {
        client.shutdown(done);
    });

    describe('/ping', function() {
        it('should respond on ping', function(done) {
            client.receiveMessage(function(data, done) {
                assert.include(data.content, 'Kassy', 'Did not recieve the right thing');
                done();
            }, done);
            client.sendMessage('/ping');
        });
    });

    describe('/uptime', function() {
        it('should respond with how long it has been alive', function(done) {
            client.receiveMessage(function(data, done) {
                assert.include(data.content, 'I\'ve been alive for ', 'Did not recieve the right thing');
                done();
            }, done);
            client.sendMessage('/uptime');
        });
    });

    describe('/creator', function() {
        it('should respond with a list of creators', function(done) {
            client.receiveMessage(function(data, done) {
                assert.include(data.content, 'Matthew', 'Did not recieve the right thing');
                done();
            }, done);
            client.sendMessage('/creator');
        });
    });
});
