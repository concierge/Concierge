'use strict';

const chai = require('chai');
const assert = chai.assert;
const ConfigService = new (c_require('core/modules/config.js'))();

// another fairly impossible to test service, due to its dependance on lazy loading the real thing

describe('config', () => {
    describe('#getGlobalIndicator()', () => {
        it('should return a valid object for a global indicator', () => {
            assert.isTrue(!!ConfigService.getGlobalIndicator());
            assert.isTrue(!!ConfigService.getGlobalIndicator().name);
            assert.isTrue(ConfigService.getGlobalIndicator().type.length > 0);
        });
    });
});
