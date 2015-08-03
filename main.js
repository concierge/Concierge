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
var platform = require('./core/platform.js');

// Get startup mode
if (!process.argv[2]) {
  process.argv.push('test');
}
process.argv[2] = process.argv[2].toLowerCase();

// Start platform or fail
platform.listModes(function(modes) {
	try {
		platform.setMode(modes[process.argv[2]]);
	}
	catch(e) {
		console.error('Unknown mode \'' + process.argv[2] + '\'');
		process.exit(-1);
	}
  platform.start();
});
