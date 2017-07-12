'use strict';

const chai = require('chai');
const assert = chai.assert;
const npm = c_require('core/common/npm.js');

// calls an external process with no callback or response, so almost untestable

describe('npm', () => {
    describe('exports', () => {
        it('should not throw an exception', async(done) => {
            try {
                npm(['v']);
                npm(['v'], __dirname);
            }
            catch (e) {
                assert.isTrue(false);
            }
            done();
        }).timeout(10000);
    });
});
