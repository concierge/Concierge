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
    write = process.stdout.write,
    perr = process.stderr.write,
    debug = false,
    log = false,
    logStr = null,
    logFile = 'kassy.log',
		timestamp = false,
    startupTime = (new Date().getTime() / 1000),
		lastNewline = false;

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

getLogMessage = function(data) {
	if (timestamp) {
		var time = getTimestampString(),
			spl = data.split('\n');
		if (lastNewline) {
			spl[0] = '\n' + spl[0];
		}
		for (var i = 1; i < spl.length; i++) {
			if (strip(spl[i]).length > 0) {
				spl[i] = '             ' + spl[i];
				lastNewline = i === spl.length - 1;
			}
			else {
				lastNewline = false;
			}
		}
		data = time + spl.join('\n');
	}
	return data;
};

console.info = function (args) {
    info(args.info);
};

console.error = function (args) {
    error(args.error);
};

console.warn = function (args) {
    warn(args.warn);
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
    process.stdout.write(args.info);
};

process.on('exit', function () {
   if (log) {
       var dt = new Date();
       logStr.write('~ Log terminated at ' + dt.toISOString() + ' ~\n');
       logStr.end();
   }
});

process.stdout.write = function (data) {
	data = getLogMessage(data);
    write.apply(this, arguments);
    if (log) {
        logStr.write(data);
    }
};

process.stderr.write = function (data) {
		data = getLogMessage(data);
    perr.apply(this, arguments);
    if (log) {
        logStr.write(data);
    }
};

exports.setDebug = function(enabled) {
    debug = enabled;
};

exports.setLog = function(enabled) {
    log = enabled;
    if (enabled) {
        try {
            fs.unlinkSync(logFile);
        }
        catch (e){}    // ignore, probably doesn't exist
        logStr = fs.createWriteStream(logFile, {flags: 'a'});
				var dt = new Date();
				startupTime = dt.getTime() / 1000;
				logStr.write('~ Log started at ' + dt.toISOString() + ' ~\n');
    }
    else {
        if (logStr != null) {
            logStr.end();
        }
        logStr = null;
    }
};

exports.setTimestamp = function (enabled) {
    timestamp = enabled;
};

console.isDebug = function() {
    return debug;
};
