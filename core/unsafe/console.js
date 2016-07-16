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

var colours = require.safe('colors'),
    fs = require('fs'),
    strip = require.safe('stripcolorcodes'),
    info = console.info,
    error = console.error,
    warn = console.warn,
    logg = console.log,
    write = process.stdout.write,
    perr = process.stderr.write,
    debug = false,
    timestamp = false,
    startupTime = (new Date().getTime() / 1000),
    lastNewline = false,
    log = {
        _enabled: false,
        _handle: null,
        _logFile: 'concierge.log',
        write: function(data, end = false) {
            if (this._enabled) {
                this._handle.write(strip(data.toString()));
                if (end) {
                    this._handle.end();
                }
            }
        },
        setEnabled: function(enabled) {
            if (enabled) {
                try {
                    fs.unlinkSync(this._logFile);
                }
                catch (e) { }    // ignore, probably doesn't exist
                this._handle = fs.createWriteStream(this._logFile, { flags: 'a' });
                var dt = new Date();
                startupTime = dt.getTime() / 1000;
                this.write('~ Log started at ' + dt.toISOString() + ' ~\n');
            }
            else {
                if (this._handle != null) {
                    this._handle.end();
                }
                this._handle = null;
            }
            this._enabled = enabled;
        }
    };

colours.setTheme({
    info: 'cyan',
    warn: 'yellow',
    error: ['red', 'bold'],
    title: ['green', 'bold']
});

var getTimestampString = function() {
    var dt = new Date(),
        diff = (dt.getTime() / 1000) - startupTime,
        time = '[' + ('          ' + diff.toFixed(2)).slice(-10) + '] ';
    return time;
},

getOutputString = function(data) {
    if (timestamp) {
        var time = getTimestampString(),
            spl = data.toString().split('\n');
        if (lastNewline) {
            time = '\n' + time;
            lastNewline = false;
        }
        for (var i = 1; i < spl.length; i++) {
            if (strip(spl[i]).length > 0) {
                spl[i] = '             ' + spl[i];
            }
        }
        process.stdout.write(time);
        data = spl.join('\n');
    }
    return data;
};

console.info = function (args) {
    info(getOutputString(args.info));
};

console.error = function (args) {
    error(getOutputString(args.error));
};

console.warn = function (args) {
    warn(getOutputString(args.warn));
};

console.log = function (args) {
    logg(getOutputString(args));
};

console.title = function(args) {
    console.log(args.title);
};

console.debug = function (args) {
    if (debug && args) {
        console.warn(args);
    }
};

console.critical = function(args) {
    if (debug && args) {
        console.error(args.stack ? args.stack : args);
    }
};

console.write = function (args) {
    process.stdout.write(getOutputString(args.info));
    if (!args.endsWith('\n')) {
        lastNewline = true;
    }
};

process.on('exit', function () {
    var dt = new Date();
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

exports.setDebug = function(enabled) {
    debug = enabled;
};

exports.setLog = function (enabled) {
    log.setEnabled(enabled);
};

exports.setTimestamp = function (enabled) {
    timestamp = enabled;
    if (timestamp) {
        var dt = new Date();
        console.info('~ Started at ' + dt.toISOString() + ' ~');
    }
};

console.isDebug = function() {
    return debug;
};
