/**
 * Sets up the console.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

var colours = require('colors'),
	fs		= require('fs'),
	strip	= require('stripcolorcodes'),
    info    = console.info,
    error   = console.error,
    warn    = console.warn,
	write	= process.stdout.write,
	perr	= process.stderr.write,
    debug   = false,
	log		= false,
	logStr	= null,
	logFile	= 'kassy.log';

colours.setTheme({
    info:   'cyan',
    warn:   'yellow',
    error:  ['red', 'bold'],
    title:  ['green', 'bold']
});

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
    if (debug) {
        console.warn(args);
    }
};

console.critical = function(args) {
    if (debug) {
        console.error(args);
        console.trace();
    }
};

console.write = function (args) {
    process.stdout.write(args.info);
};

process.on('exit', function () {
   if (log) {
	   logStr.end();
   }
});

process.stdout.write = function (data) {
	write.apply(this, arguments);
	if (log) {
		logStr.write(strip(data));
	}
};

process.stderr.write = function (data) {
	perr.apply(this, arguments);
	if (log) {
		logStr.write(strip(data));
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
		catch (e){}	// ignore, probably doesn't exist
		logStr = fs.createWriteStream(logFile, {flags: 'a'});
	}
	else {
		if (logStr != null) {
			logStr.end();
		}
		logStr = null;
	}
};

console.isDebug = function() {
    return debug;
};