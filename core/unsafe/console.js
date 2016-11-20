/**
 * Sets up the console and logging system.
 *
 * Code in here consists of nasty hacks to the console and process
 * prototypes, done so that we have control over how the console
 * is logged to.
 *
 * Written By:
 *        Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2015.
 */
let debug = false,
     timestamp = false,
     lastNewline = false,
     startupTime = (new Date().getTime() / 1000);

const colours = require('colors'),
    fs = require('fs'),
    strip = require('stripcolorcodes'),
    info = console.info,
    error = console.error,
    warn = console.warn,
    logg = console.log,
    write = process.stdout.write,
    perr = process.stderr.write,

    log = {
        _enabled: false,
        _handle: null,
        _logFile: 'concierge.log',
        write: (data, end = false) => {
            if (log._enabled) {
                log._handle.write(strip(data.toString()));
                if (end) {
                    log._handle.end();
                }
            }
        },
        setEnabled: (enabled) => {
            if (enabled) {
                try {
                    fs.unlinkSync(log._logFile);
                }
                catch (e) { }    // ignore, probably doesn't exist
                log._handle = fs.createWriteStream(log._logFile, { flags: 'a' });
                const dt = new Date();
                startupTime = dt.getTime() / 1000;
                log.write('~ Log started at ' + dt.toISOString() + ' ~\n');
            }
            else {
                if (log._handle != null) {
                    log._handle.end();
                }
                log._handle = null;
            }
            log._enabled = enabled;
        }
    };

colours.setTheme({
    info: 'cyan',
    warn: 'yellow',
    error: ['red', 'bold'],
    title: ['green', 'bold']
});

const getTimestampString = () => {
    const dt = new Date(),
        diff = (dt.getTime() / 1000) - startupTime,
        time = '[' + ('          ' + diff.toFixed(2)).slice(-10) + '] ';
    return time;
},

getOutputString = (data) => {
    if (timestamp) {
        const spl = String(data).split('\n');
        let time = getTimestampString();

        if (lastNewline) {
            time = '\n' + time;
            lastNewline = false;
        }
        for (let i = 1; i < spl.length; i++) {
            if (strip(spl[i]).length > 0) {
                spl[i] = '             ' + spl[i];
            }
        }
        process.stdout.write(time);
        data = spl.join('\n');
    }
    return data;
};

console.info = (args) => {
    info(getOutputString(args.info));
};

console.error = (args) => {
    error(getOutputString(args.error));
};

console.warn = (args) => {
    warn(getOutputString(args.warn));
};

console.log = (args) => {
    logg(getOutputString(args));
};

console.title = (args) => {
    console.log(args.title);
};

console.debug = (args) => {
    if (debug && args) {
        console.warn(args);
    }
};

console.critical = (args) => {
    if (debug && args) {
        console.error(args.stack ? args.stack : args);
    }
};

console.write = (args) => {
    process.stdout.write(getOutputString(args.info));
    if (!args.endsWith('\n')) {
        lastNewline = true;
    }
};

process.on('exit', () => {
    const dt = new Date();
    if (timestamp) {
        console.info('~ Terminated at ' + dt.toISOString() + ' ~');
    }

    log.write('~ Log terminated at ' + dt.toISOString() + ' ~\n', true);
});

process.stdout.write = function (data) {
    write.apply(this, arguments);
    log.write(data);
};

process.stderr.write = function (data) {
    perr.apply(this, arguments);
    log.write(data);
};

exports.setDebug = (enabled) => {
    debug = enabled;
};

exports.setLog = (enabled) => {
    log.setEnabled(enabled);
};

exports.setTimestamp = (enabled) => {
    timestamp = enabled;
    if (timestamp) {
        const dt = new Date();
        console.info('~ Started at ' + dt.toISOString() + ' ~');
    }
};

console.isDebug = () => {
    return debug;
};
