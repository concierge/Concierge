let consolec = require('./unsafe/console.js'),
    options = [
        {
            long: '--debug',
            short: '-d',
            description: 'Enables debug level logging.',
            run: function() {
                console.warn('Debug mode enabled.');
                consolec.setDebug(true);
            }
        },
        {
            long: '--log',
            short: '-l',
            description: 'Saves logs to a local file.',
            run: function() {
                console.warn('Logging mode enabled.');
                consolec.setLog(true);
            }
        },
        {
            long: '--timestamp',
            short: '-t',
            description: 'Adds a timestamp to each output log message.',
            run: function () {
                console.warn('Console timestamps enabled.');
                consolec.setTimestamp(true);
            }
        },
        {
            long: '--language',
            short: '-i',
            description: 'Sets the locale that should be used by the bot.',
            expects: ['LOCALE'],
            run: function (value) {
                console.warn(`Locale set to "${value[0]}".`);
                global.__i18nLocale = value[0];
            }
        },
        {
            long: '--moduledir',
            short: '-m',
            description: 'Sets the search path for modules used by the bot.',
            expects: ['DIRECTORY'],
            run: function (value) {
                let path = require('path');
                global.__modulesPath = path.resolve(value[0]);
                console.warn(`Modules directory set to "${value}".`);
            }
        },
        {
            long: '--help',
            short: '-h',
            description: 'Shows this help.',
            run: function() {
                console.log('USAGE\n\tnode main.js ' + '<options...>'.cyan + '\nOPTIONS');
                for (let i = 0; i < options.length; i++) {
                    let infoStr = '\t' + options[i].short + ', ' + options[i].long;
                    if (options[i].expects) {
                        infoStr += ' ';
                        for (let j = 0; j < options[i].expects.length; j++) {
                            infoStr += '{' + options[i].expects[j].yellow + '} ';
                        }
                    }
                    console.info(infoStr);
                    console.log('\t\t' + options[i].description);
                }
                process.exit(0);
            }
        }
    ];

exports.runArguments = function (args) {
    for (let i = 0; i < args.length; i++) {
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

        let vals = [],
            count = (pargs[0].expects || {}).length || 0;
        for (let j = 1; j <= count; j++) {
            vals.push(args[i + j]);
        }

        pargs[0].run(vals);
        let diff = 1 + count;
        args.splice(i, diff);
        i -= diff;
    }
};
