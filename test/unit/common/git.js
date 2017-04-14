'use strict';

const chai = require('chai');
const assert = chai.assert;
const git = c_require('core/common/git.js');

// the clone method of this file is actually used to bootstrap the tests,
// so we wouldnt have gotten this far without it working as intended.

describe.skip('git', () => {
    describe('#getSHAOfHead()', () => {
        it('should get SHA hash of git head', () => {
            git.getSHAOfHead((err, data) => { // not async...
                assert.equal(40, data.trim().length);
                assert.equal('string', typeof(data));
                assert.isFalse(!!err);
            });
        });
    });

    describe('#getSHAOfRemoteMaster()', () => {
        it('should get SHA hash of remote git master', () => {
            git.getSHAOfRemoteMaster((err, data) => { // not async...
                assert.equal(40, data.trim().length);
                assert.equal('string', typeof (data));
                assert.isFalse(!!err);
            });
        });
    });

    describe('#getSHAOfRemoteMaster()', () => {
        it('should get current branch name', () => {
            git.getCurrentBranchName((err, data) => { // not async...
                assert.equal('string', typeof (data));
                assert.isFalse(!!err);
            });
        });
    });
});
