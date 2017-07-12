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
    fileLogger = new (winston.transports.File)({
        name: 'concierge-file',
        filename: 'concierge.log',
        level: 'silly',
        timestamp: true,
        colorize: false
    });
require('colors');

// when called via other means (e.g. grunt, bold is sometimes broken)
String.prototype.__defineGetter__('bold', function () {
    return `\u001b[1m${this}\u001b[22m`;
});

global.LOG = new winston.Logger();
const theme = {
    silly: ['magenta', 'reset'],
    debug: ['cyan', 'reset'],
    verbose: ['grey', 'reset'],
    info: ['green', 'reset'],
    warn: ['yellow', 'bold', 'reset'],
    error: ['red', 'bold', 'reset']
};
winston.addColors(theme);

global.LOG.add(winston.transports.Console, {
    colorize: 'all',
    timestamp: false,
    level: 'info'
});

const wrapMethod = (obj, method, logMethod = null) => {
    obj[method] = (...args) => global.LOG[logMethod || method]
        .apply(global.LOG, [util.format.apply(util.format, Array.prototype.slice.call(args))]);
};

wrapMethod(console, 'error');
wrapMethod(console, 'warn');
wrapMethod(console, 'info');
wrapMethod(console, 'log', 'verbose');
wrapMethod(console, 'debug');
wrapMethod(console, 'silly');

global.LOG.title = console.title = args => console.warn(args.white.bold.reset);
global.LOG.critical = console.critical = args => console.debug(args.stack.toString() || args.toString());
global.LOG.setLog = console.setLog = enabled => global.LOG[enabled ? 'add' : 'remove'](fileLogger, null, true);
global.LOG.validateLogLevel = console.validateLogLevel = logLevel => {
    logLevel = logLevel.trim().toLowerCase();
    return !!theme[logLevel] ? logLevel : null;
};
global.LOG.setLogLevel = console.setLogLevel = logLevel => {
    logLevel = global.LOG.validateLogLevel(logLevel);
    if (!logLevel) {
        throw new Error(`${logLevel} is not a valid log level.`);
    }
    return global.LOG.transports.console.level = logLevel;
};
global.LOG.setTimestamp = console.setTimestamp = enabled => global.LOG.transports.console.timestamp = enabled;
