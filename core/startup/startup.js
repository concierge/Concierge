/**
 * Handles the startup of Concierge.
 *
 * Written By:
 *         Matthew Knox
 *
 * Contributors:
 *         Dion Woolley
 *         Jay Harris
 *         Matt Hartstonge
 *         (Others, mainly strange people)
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2016.
 */

const translationsReq = rootPathJoin('core/translations/translations.js'),
    platformReq = rootPathJoin('core/platform.js');

let startArgs = null;

const checkShutdownCode = (code) => {
    if (code === StatusFlag.ShutdownShouldRestart) {
        global.currentPlatform.removeListener('shutdown', checkShutdownCode);
        global.currentPlatform = null;
        require.unrequire(translationsReq, __filename);
        require.unrequire(platformReq, __filename);
        if (!global.__runAsRequired) {
            exports.run();
        }
    }
    else if (!global.__runAsRequired) {
        process.exit(0);
    }
};

exports.run = (...args) => {
    try {
        if (args.length > 0) {
            if (!args[0]) {
                args[0] = [];
            }
            startArgs = JSON.stringify(args);
        }

        global.$$ = require(translationsReq);

        // quickest way to clone in JS, prevents reuse of same object between startups
        const startClone = JSON.parse(startArgs),
            Platform = require(platformReq);
        global.currentPlatform = new Platform(global.__runAsRequired);
        global.currentPlatform.on('shutdown', checkShutdownCode);
        global.currentPlatform.start.apply(global.currentPlatform, startClone);
        return global.currentPlatform;
    }
    catch (e) {
        console.critical(e);
        console.error('A critical error occurred while running. Please check your configuration or report a bug.');
        if (!global.__runAsRequired) {
            process.exit(-3);
        }
        throw e;
    }
};

const stop = () => {
    if (global.currentPlatform) {
        global.currentPlatform.shutdown();
    }
    if (!global.__runAsRequired) {
        process.exit(0);
    }
};

process.on('SIGHUP', () => {
    console.warn('SIGHUP received. This has an unconditional 10 second terminate time which may not be enough to properly shutdown...');
    stop();
});

process.on('SIGINT', () => {
    stop();
});
