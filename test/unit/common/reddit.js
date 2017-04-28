'use strict';

const chai = require('chai');
const assert = chai.assert;
const reddit = c_require('core/common/reddit.js');

describe.skip('reddit', () => {
    describe('#reddit()', () => {
        it('should return data from programmerreactions', done => {
            reddit.reddit('programmerreactions', 10, (err, data) => {
                assert.isFalse(!!err);
                assert.isTrue(!!data);
                done();
            });
        }).timeout(10000);
    });
});
