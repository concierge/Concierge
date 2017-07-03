const argsParser = require('concierge/arguments');
const conciergeArguments = [
    {
        long: '--debug',
        short: '-d',
        description: 'Sets the log level. Argument is optional. Default=info.',
        expects: ['LEVEL'],
        defaults: ['debug'],
        run: (out, value) => {
            if (!global.LOG.validateLogLevel(value[0])) {
                throw new Error();
            }
        }
    },
    {
        long: '--log',
        short: '-l',
        description: 'Saves logs to a local file.'
    },
    {
        long: '--timestamp',
        short: '-t',
        description: 'Adds a timestamp to each output log message.'
    },
    {
        long: '--language',
        short: '-i',
        description: 'Sets the locale that should be used by the bot.',
        expects: ['LOCALE']
    },
    {
        long: '--moduledir',
        short: '-m',
        description: 'Sets the search path for modules used by the bot.',
        expects: ['DIRECTORY']
    },
    {
        long: '--version',
        short: '-v',
        description: 'Prints the installed version information.',
        run: out => {
            const pi = require(global.rootPathJoin('package.json')),
                os = require('os');
            out.log(`${pi.name} ${pi.version} @ ${os.hostname()} (${os.type()} ${os.arch()})`);
        }
    }
];

const getValue = (arg, def, message) => {
    let ret = arg;
    if (Array.isArray(arg) && arg.length === 0 || !arg) {
        ret = def;
    }
    else if (arg && arg.vals) {
        if (Array.isArray(def)) {
            ret = arg.vals;
        }
        else if (arg.vals.length === 1) {
            ret = arg.vals[0];
        }
        else {
            ret = true;
        }
    }
    if (arg && ret !== arg) {
        LOG.warn(message.replace('${0}', ret));
    }
    return ret;
};

module.exports = cliArgs => {
    // Parse optional arguments
    const args = argsParser.parseArguments(cliArgs, conciergeArguments, {
        enabled: true,
        string: 'concierge',
        colours: true,
        sections: [
            [1, 'DESCRIPTION', 'A modular, general purpose chat-bot/plugin system for Node.JS.'],
            [3, 'COPYRIGHT', `Copyright (c) ${(new Date()).getFullYear()} Matthew Knox and Contributors.`, 'Available under The MIT License (https://opensource.org/licenses/MIT).']
        ]
    }, true);

    // Check if help or version was run
    if (args.parsed['-h'] || args.parsed['-v']) {
        process.exit(global.StatusFlag.Shutdown);
    }

    return {
        integrations: getValue(args.unassociated, ['test'], 'No integrations specified, defaulting to "test".'),
        locale: getValue(args.parsed['-i'], 'en', 'Locale set to "${0}".'),
        debug: getValue(args.parsed['-d'], 'info', 'Log level set to "${0}".'),
        timestamp: getValue(args.parsed['-t'], false, 'Timestamps enabled.'),
        modules: getValue(args.parsed['-m'], global.__modulesPath, 'Modules directory set to "${0}".'),
        log: getValue(args.parsed['-l'], false, 'File logging mode enabled.')
    };
};
