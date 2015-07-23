/** Node.js server for a facebook bot (Kassy)
 *
 * Herein lies the Node.js serverside script to tell node what to do to ensure
 * we get all the magical goodness that is:
 * 		(Karma + Sassy) * Facebook - Hipchat = Kassy
 *
 * Written By:
 * 		Matthew Knox
 *
 * Contributors:
 * 		Dion Woolley
 * 		Jay Harris
 * 		Matt Hartstonge
 * 		(Mainly strange people)
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

// Add useful prototypes
if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.indexOf(str) === 0;
	};
}
if (typeof String.prototype.toProperCase != 'function') {
	String.prototype.toProperCase = function () {
		return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	};
}
if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}

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
		console.log(e);
		console.error('Unknown mode \'' + process.argv[2] + '\'');
		process.exit(-1);
	}
  platform.start();
});
