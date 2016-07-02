/**
 * Handles the startup of Kassy.
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
 *        Copyright (c) Matthew Knox and Contributors 2015.
 */
var platform = null,
    startArgs = null,
    checkShutdownCode = function (code) {
        if (code === StatusFlag.ShutdownShouldRestart) {
            exports.run();
        }
        else {
            process.exit(0);
        }
    };

exports.run = function (startArgsP) {
    try {
        if (!startArgs && startArgsP) {
            startArgs = startArgsP;
        }
        global.$$ = require.once('./translations/translations.js');

        // quickest way to clone in JS, prevents reuse of same object between startups
        var startClone = JSON.parse(JSON.stringify(startArgs)),
            Platform = require.once('./platform.js');
        platform = new Platform(startClone);
        platform.setOnShutdown(checkShutdownCode);
        platform.start();
    }
    catch (e) {
        console.critical(e);
        console.error('A critical error occurred while running. Please check your configuration or report a bug.');
        process.exit(-3);
    }
};

exports.stop = function() {
    if (platform) {
        platform.shutdown();
    }
    process.exit(0);
};
