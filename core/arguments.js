var consolec = require('./unsafe/console.js'),
    options = [
        {
            long: '--debug',
            short: '-d',
            run: function() {
                console.warn('Debug mode enabled.');
                consolec.setDebug(true);
            }
        },
        {
            long: '--log',
            short: '-l',
            run: function() {
                console.warn('Logging mode enabled.');
                consolec.setLog(true);
            }
        },
        {
            long: '--timestamp',
            short: '-t',
            run: function () {
                console.warn('Console timestamps enabled.');
                consolec.setTimestamp(true);
            }
        },
        {
            long: '--language',
            short: '-i',
            expects: 1,
            run: function (value) {
                console.warn(`Locale set to "${value[0]}".`);
                global.__i18nLocale = value[0];
            }
        }
    ];

exports.runArguments = function (args) {
    for (var i = 0; i < args.length; i++) {
        var arg = args[i],
            pargs = options.filter(function(value) {
                return value.short === arg || value.long === arg;
            });

        if (pargs.length === 0) {
            continue;
        }
        else if (pargs.length > 1) {
            throw new Error('Cannot have overlapping arguments.');
        }

        var vals = [];
        var count = pargs[0].expects || 0;
        for (var j = 1; j <= count; j++) {
            vals.push(args[i + j]);
        }

        pargs[0].run(vals);
        var diff = 1 + count;
        args.splice(i, diff);
        i -= diff;
    }
};
