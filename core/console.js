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
    info    = console.info,
    error   = console.error,
    warn    = console.warn,
    debug   = false;

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

exports.setDebug = function(enabled) {
    debug = enabled;
};