const argsParser = require('concierge/arguments'),
    path = require('path');
const conciergeArguments = [
    {
        long: '--debug',
        short: '-d',
        description: 'Sets the log level. Argument is optional. Default=info.',
        expects: ['LEVEL'],
        defaults: ['debug'],
        run: (out, value) => {
            value = value[0].trim().toLowerCase();
            console.setLogLevel(value);
            out.log(`Log level set to "${value}".`.yellow);
        }
    },
    {
        long: '--log',
        short: '-l',
        description: 'Saves logs to a local file.',
        run: out => {
            console.setLog(true);
            out.log('File logging mode enabled.'.yellow);
        }
    },
    {
        long: '--timestamp',
        short: '-t',
        description: 'Adds a timestamp to each output log message.',
        run: out => {
            console.setTimestamp(true);
            out.log('Timestamps enabled.'.yellow);
        }
    },
    {
        long: '--language',
        short: '-i',
        description: 'Sets the locale that should be used by the bot.',
        expects: ['LOCALE'],
        run: (out, value) => {
            out.log(`Locale set to "${value[0]}".`.yellow);
            global.__i18nLocale = value[0];
        }
    },
    {
        long: '--moduledir',
        short: '-m',
        description: 'Sets the search path for modules used by the bot.',
        expects: ['DIRECTORY'],
        run: (out, value) => {
            global.__modulesPath = path.resolve(value[0]);
            out.log(`Modules directory set to "${value}".`.yellow);
        }
    }
];

module.exports = cliArgs => {
    try {
        // Parse optional arguments
        const args = argsParser.parseArguments(cliArgs, conciergeArguments, {
                enabled: true,
                string: 'node main.js',
                colours: true
            },
            true);
        // Check if help was run
        if (args.parsed['-h']) {
            process.exit(0);
        }

        // Check startup modes
        if (args.unassociated.length === 0) {
            console.info('No integrations specified, defaulting to \'test\'.');
            args.unassociated.push('test');
        }

        return args;
    }
    catch (e) {
        console.error(e.message);
        process.exit(-1);
    }
    return null;
};
