﻿/**
 * Sets up the console.
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

    /*
    Credit to an answer to this thread https://stackoverflow.com/questions/7357734/how-do-i-get-the-time-of-day-in-javascript-node-js
    */
    getDateTime = function() {
        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min  = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec  = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day  = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec + " ";
    }

colours.setTheme({
    info: 'cyan',
    warn: 'yellow',
    error: ['red', 'bold'],
    title: ['green', 'bold']
});

console.info = function (args) {
    info(args.info);
};

console.error = function (args) {
    if (debug) {
        error(getDateTime() + args.error);
    }
    else {
        error(args.error);
    }
};

console.warn = function (args) {
    if (debug) {
        warn(getDateTime() + args.warn);
    }
    else {
        warn(args.warn);
    }
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
        catch (e){}    // ignore, probably doesn't exist
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
