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

// Bootstrap platform
var platform    = require('./core/platform.js'),
    modes       = require('./core/modes.js');

// Determine if debug output is enabled
var debug = false;
if (process.argv[2] === 'debug') {
	process.argv.splice(2, 1);
	debug = true;
	platform.debug = true;
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
		platform.setMode(modes[process.argv[2]]);
	}
	catch(e) {
		if (debug) {
			console.error(e);
			console.trace();
		}
        console.error('Unknown mode \'' + process.argv[2] + '\'');
	    console.error('The modes avalible on your system are:');
	    for (var mode in modes) {
	        console.error('\t- \'' + mode + '\'');
	    }
		process.exit(-1);
	}
	platform.start();
});
