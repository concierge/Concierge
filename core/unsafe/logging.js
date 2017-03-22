/**
 * Sets up the console and logging system.
 *
 * Code in here consists of nasty hacks to the console prototypes
 * so that we have control over how the console is logged to.
 *
 * Written By:
 *        Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2017.
 */

const util = require('util'),
    winston = require('winston'),
    colours = require('colors'),
    fileLogger = new (winston.transports.File)({
        name: 'concierge-file',
        filename: 'concierge.log',
        level: 'info',
        timestamp: false,
        colorize: false
    });

global.LOG = new winston.Logger();

colours.setTheme({
    info: 'cyan',
    warn: 'yellow',
    error: ['red', 'bold'],
    title: ['green', 'bold']
});

global.LOG.add(winston.transports.Console, {
    colorize: true,
    timestamp: false,
    level: 'info'
});

const formatArgs = (args, colour) => {
    const out = [util.format.apply(util.format, Array.prototype.slice.call(args))];
    if (colour)
        out[0] = out[0][colour];
    return out;
};

console.log = (...args) => global.LOG.info.apply(global.LOG, formatArgs(args));
console.info = (...args) => global.LOG.info.apply(global.LOG, formatArgs(args, 'info'));
console.warn = (...args) => global.LOG.warn.apply(global.LOG, formatArgs(args, 'warn'));
console.error = (...args) => global.LOG.error.apply(global.LOG, formatArgs(args, 'error'));
console.debug = (...args) => global.LOG.debug.apply(global.LOG, formatArgs(args, 'warn'));
console.critical = args => console.error(args.stack.toString() || args.toString());
console.title = (...args) => global.LOG.info.apply(global.LOG, formatArgs(args, 'title'));
console.write = console.log;

console.isDebug = () => global.LOG.transports.console.level === 'debug';
console.setDebug = enabled => fileLogger.level = global.LOG.transports.console.level = enabled ? 'debug' : 'info';
console.setLog = enabled => global.LOG[enabled ? 'add' : 'remove'](fileLogger, null, true);
console.setTimestamp = enabled => global.LOG.transports.console.level = fileLogger.timestamp = enabled;
