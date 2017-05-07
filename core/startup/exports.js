/**
 * Handles require('concierge-bot')
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2017.
 */

const Platform = require(global.rootPathJoin('core/platform.js')),
    path = require('path');

const checkType = (obj, key, expectation, ret = false) => {
    const type = Array.isArray(obj[key]) ? 'array' : typeof (obj[key]);
    if (type !== expectation && !ret) {
        throw new Error(`"${key}" has an invalid type "${type}" when "${expectation}" was expected.`);
    }
    return type === expectation;
};

module.exports = opts => {
    opts = opts || {};

    global.$$ = require(rootPathJoin('core/translations/translations.js'));
    if (opts.locale && checkType(opts, 'locale', 'string')) {
        $$.setLocale(opts.locale);
    }
    else {
        $$.setLocale('en');
    }

    console.setTimestamp(!!opts.timestamp);
    if (checkType(opts, 'debug', 'string', true)) {
        console.setLogLevel(opts.debug.trim().toLowerCase());
    }
    else if (checkType(opts, 'debug', 'boolean')) {
        console.setLogLevel(opts.debug ? 'debug' : 'info');
    }

    if (opts.log && checkType(opts, 'debug', 'boolean')) {
        console.setLog(opts.log);
    }

    // start platform
    if (opts.modules || !opts.runInit) {
        if (checkType(opts, 'modules', 'string', true)) {
            global.__modulesPath = path.resolve(opts.modules);
            delete opts.modules;
        }
        else {
            checkType(opts, 'modules', 'array');
        }
    }
    if (opts.integrations) {
        checkType(opts, 'integrations', 'array');
    }

    const p = new Platform(!!opts.runInit);
    if (p === null || p === void(0)) {
        throw new Error('An unexpected error occurred during startup.');
    }
    global.currentPlatform = p;
    p.start(opts.integrations || [], opts.modules);

    // loopback
    if (opts.loopback) {
        const cfg = p.config.getSystemConfig('loopback');
        if (checkType(opts, 'loopback', 'boolean', true)) {
            cfg.enabled = true;
            cfg.maxDepth = 5;
        }
        else if (checkType(opts, 'loopback', 'object')) {
            for (let key in opts.loopback) {
                cfg[key] = opts.loopback[key];
            }
        }
    }

    return p;
};
