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
            run: function() {
                    consolec.setTimestamp(true);
            }
        }
    ];

exports.runArguments = function(args) {
    for (var i = 0; i < args.length; i++) {
        var arg = args[i],
            pargs = options.filter(function(value) {
                    return value.short === arg || value.long === arg;
            });

        if (pargs.length === 0) {
            continue;
        }
        else if (pargs.length > 1) {
            throw 'Cannot have overlapping arguments.';
        }

        pargs[0].run();
        args.splice(i, 1);
        i--;
    }
};
