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
    silly: 'blue',
    debug: 'cyan',
    log: 'white',
    info: 'green',
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
    const res = [util.format.apply(util.format, Array.prototype.slice.call(args))];
    if (colour) {
        res[0] = res[0][colour];
    }
    return res;
};

console.error = (...args) => global.LOG.error.apply(global.LOG, formatArgs(args, 'error'));
console.warn = (...args) => global.LOG.warn.apply(global.LOG, formatArgs(args, 'warn'));
console.info = (...args) => global.LOG.info.apply(global.LOG, formatArgs(args, 'info'));
console.log = (...args) => global.LOG.verbose.apply(global.LOG, formatArgs(args, 'log'));
console.debug = (...args) => global.LOG.debug.apply(global.LOG, formatArgs(args, 'debug'));
console.silly = (...args) => global.LOG.silly.apply(global.LOG, formatArgs(args, 'silly'));

console.critical = args => console.error(args.stack.toString() || args.toString());
console.title = (...args) => global.LOG.info.apply(global.LOG, formatArgs(args, 'title'));

console.setLog = enabled => global.LOG[enabled ? 'add' : 'remove'](fileLogger, null, true);
console.setLogLevel = logLevel => {
    if (!['error', 'warn', 'info', 'verbose', 'debug', 'silly'].includes(logLevel)) {
        throw new Error(`${logLevel} is not a valid log level.`);
    }
    return fileLogger.level = global.LOG.transports.console.level = logLevel;
};
console.setTimestamp = enabled => {
    return global.LOG.transports.console.timestamp = fileLogger.timestamp = enabled;
};
