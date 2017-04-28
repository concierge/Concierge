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

const checkType = (obj, key, expectation, ret = false) => {
    const type = Array.isArray(obj[key]) ? 'array' : typeof (obj[key]);
    if (type !== expectation && !ret) {
        throw new Error(`"${key}" has an invalid type "${type}" when "${expectation}" was expected.`);
    }
    return type === expectation;
};

module.exports = startup => {
    return opts => {
        opts = opts || {};

        // config options
        if (opts.locale && checkType(opts, 'locale', 'string')) {
            $$.setLocale(opts.locale);
        }

        console.setTimestamp(!!opts.timestamp);
        if (checkType(opts, 'debug', 'string', true)) {
            console.setLogLevel(opts.debug.trim().toLowerCase());
        }
        else if (checkType(opts, 'debug', 'boolean')) {
            console.setLogLevel(opts.debug ? 'debug' : 'info');
        }

        // start platform
        checkType(opts, 'modules', 'array');
        if (opts.integrations) {
            checkType(opts, 'integrations', 'array');
        }
        const p = startup.run(opts.integrations || [], opts.modules);
        if (p === null || p === void(0)) {
            throw new Error('An unexpected error occurred during startup.');
        }

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
};
