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

exports.run = function() {
        try {
            var Platform = require.once('./platform.js'),
                platform = new Platform();
            platform.setOnShutdown(checkShutdownCode);
            platform.start();
        }
        catch(e) {
            console.critical(e);
            console.error('A critical error occurred while running. Please check your configuration or report a bug.');
            process.exit(-3);
        }
    },
    checkShutdownCode = function(code) {
        if (code === StatusFlag.ShutdownShouldRestart) {
            exports.run();
        }
    };
