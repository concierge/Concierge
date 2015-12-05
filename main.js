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

// Load NodeJS Modifications/Variables
require('./core/require.js');
require('./core/prototypes.js');
require('./core/status.js');

var consolec	= require('./core/console.js'),
	modesf		= require('./core/modes.js'),
	startup		= require('./core/startup.js'),
	modes		= Object.keys(modesf.listModes()),
	arguments	= process.argv;

arguments.splice(0, 2);

// Determine if debug output is enabled
if (arguments[0] === 'debug') {
    console.warn('Debug mode enabled.');
	arguments.splice(0, 1);
    consolec.setDebug(true);
}

// Determine if logging output is enabled
if (arguments[0] === 'log') {
    console.warn('Logging mode enabled.');
	arguments.splice(0, 1);
    consolec.setLog(true);
}

// Check startup modes
for (var i = 0; i < arguments.length; i++) {
	arguments[i] = arguments[i].toLowerCase();
	if (!modes.includes(arguments[i])) {
		console.error(('Unknown mode \'' + arguments[i] + '\''));
		console.info('The modes avalible on your system are:');
		for (var i = 0; i < modes.length; i++) {
			console.info('\t- \'' + modes[i] + '\'');
		}
		process.exit(-2);
	}
}

if (!arguments || arguments.length == 0) {
    console.info('No mode specified, defaulting to \'test\'.');
	arguments.push('test');
}

process.on('uncaughtException', function(err) {
	console.error('An unhandled error occurred. Start as debug for details.');
	console.critical(err);
});

startup.run(arguments);