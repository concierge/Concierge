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

module.exports = startup => {
    return opts => {
        opts = opts || {};

        // start platform
        const p = startup.run();
        if (p === null || p === void(0)) {
            throw new Error('An unexpected error occurred during startup.');
        }

        // config options
        if (opts.locale) {
            $$.setLocale(opts.locale);
        }
        p.allowLoopback = !!opts.loopback;

        console.setTimestamp(!!opts.timestamp);
        if (typeof (opts.debug) === 'string') {
            console.setLogLevel(opts.debug.trim().toLowerCase());
        }
        else {
            console.setLogLevel(!!opts.debug ? 'debug' : 'info');
        }

        // load modules
        if (Array.isArray(opts.modules)) {
            for (let m of opts.modules) {
                const descriptor = p.modulesLoader.verifyModule(m);
                p.modulesLoader.loadModule(descriptor);
            }
        }

        // start integrations
        if (Array.isArray(opts.integrations)) {
            for (let i of opts.integrations) {
                p.modulesLoader.startIntegration(p.onMessage.bind(p), i);
            }
        }

        return p;
    };
};
