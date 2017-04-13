const chai = require('chai');
const assert = chai.assert;
const files = c_require('core/common/files.js');

describe('files', () => {
    describe('#filesInDirectory()', () => {
        it('should not throw an exception on an invalid/empty directory', () => {
            assert.deepEqual([], files.filesInDirectory('_foobarbaz_'));
        });

        it('should return a list of files in a directory', () => {
            const f = files.filesInDirectory(__dirname);
            const known = ['arguments.js', 'files.js', 'git.js', 'middleware.js', 'npm.js', 'reddit.js'];
            for (let file of known) {
                assert.isTrue(f.includes(file));
            }
        });
    });
});
