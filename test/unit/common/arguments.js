'use strict';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const argumentParser = c_require('core/common/arguments.js');

describe('arguments', () => {
    const args = ['-s', '--long', '--foo', 'fooArg', '--baz', 'optBazArg', '-h', 'unassociated'];
    const opts = [
        {
            long: '--short',
            short: '-s',
            description: 'Test short argument.',
            run: out => {
                out.log('Hello World');
            }
        },
        {
            long: '--long',
            short: '-l',
            description: 'Test long argument with all optional parameters.',
            expects: ['SOMETHING', 'ELSE', 'HERE'],
            defaults: [1, 2, 3]
        },
        {
            long: '--foo',
            short: '-f',
            description: 'Test argument with value and no default.',
            expects: ['VALUE'],
            run: (out, vals) => {
                out.log(vals[0]);
            }
        },
        {
            long: '--baz',
            short: '-b',
            description: 'Test argument with value and overridden default.',
            expects: ['VALUE', 'VALUE2'],
            defaults: ['bar', 'baz']
        }
    ];
    const parsed = argumentParser.parseArguments(args, opts, {
        enabled: true,
        string: 'test',
        colours: false
    });

    describe('#parseArguments()', () => {
        it('all given arguments should be parsed', () => {
            assert.equal(1, parsed.unassociated.length);
        });

        it('defaults should be used only where needed', () => {
            assert.deepEqual([1, 2, 3], parsed.parsed['-l'].vals);
            assert.deepEqual(['optBazArg', 'baz'], parsed.parsed['-b'].vals);
        });

        it('values should stored', () => {
            assert.deepEqual(['fooArg'], parsed.parsed['-f'].vals);
        });

        it('help should be generated', () => {
            assert.isTrue(!!parsed.parsed['-h']);
        });

        it('logs should be stored', () => {
            assert.equal('Hello World', parsed.parsed['-s'].out.trim());
            assert.equal('fooArg', parsed.parsed['-f'].out.trim());
        });

        it('should store unparsed arguments', () => {
            assert.equal('unassociated', parsed.unassociated[0]);
        });

        expect(() => {
            argumentParser.parseArguments(['-f'], opts, {
                enabled: true,
                string: 'test',
                colours: false
            });
        }).to.throw('Options should not overlap (check "--help").');

        expect(() => {
            opts.splice(opts.findIndex(o => o.long === '--help'), 1);
            opts.splice(opts.findIndex(o => o.long === '--help'), 1);
            argumentParser.parseArguments(['-f'], opts, {
                enabled: true,
                string: 'test',
                colours: false
            });
        }).to.throw('Too few arguments given to "-f"');
    });
});
