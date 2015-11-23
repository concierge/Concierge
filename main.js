/** Node.js server for a bot (Kassy)
 *
 * Herein lies the Node.js serverside script to tell node what to do to ensure
 * we get all the magical goodness that is:
 * 		(Karma + Sassy) * Facebook - Hipchat = Kassy
 * Note: it does waaaaaaay more than this now. It even runs on slack!
 *
 * Written By:
 * 		Matthew Knox
 *
 * Contributors:
 * 		Dion Woolley
 * 		Jay Harris
 * 		Matt Hartstonge
 * 		(Others, mainly strange people)
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

// Start platform
var consolec    = require('./core/console.js'),
    platform    = require('./core/platform.js'),
    modes       = require('./core/modes.js');

// Determine if debug output is enabled
if (process.argv[2] === 'debug') {
    console.warn('Debug mode enabled.');
	process.argv.splice(2, 1);
    consolec.setDebug(true);
}

// Get startup mode
if (!process.argv[2]) {
    console.info('No mode specified, defaulting to \'test\'.');
	process.argv.push('test');
}
process.argv[2] = process.argv[2].toLowerCase();

// Start platform or fail
modes.listModes(function(modes) {
	try {
		if (!platform.setMode(modes[process.argv[2]])) {
		    process.exit(-1);
		}
	}
	catch (e) {
	    console.critical(e);
        console.error(('Unknown mode \'' + process.argv[2] + '\''));
	    console.info('The modes avalible on your system are:');
	    for (var mode in modes) {
	        console.info('\t- \'' + mode + '\'');
	    }
		process.exit(-2);
    }

    try {
        platform.start();
    }
    catch (e) {
        console.critical(e);
        console.error('A critical error occured while running. Please check your configuration or report a bug.');
        process.exit(-3);
    }
});
