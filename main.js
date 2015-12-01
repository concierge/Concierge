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
if (typeof String.prototype.capitiliseFirst != 'function') {
	String.prototype.capitiliseFirst = function () {
		if (this.length >= 2) {
			return this[0].toUpperCase() + this.substring(1);
		}
		return this;
	};
}
if (!Array.prototype.includes) {
	Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
		'use strict';
		var O = Object(this);
		var len = parseInt(O.length) || 0;
		if (len === 0) {
			return false;
		}
		var n = parseInt(arguments[1]) || 0;
		var k;
		if (n >= 0) {
			k = n;
		} else {
			k = len + n;
			if (k < 0) {
				k = 0;
			}
		}
		var currentElement;
		while (k < len) {
			currentElement = O[k];
			if (searchElement === currentElement ||
				(searchElement !== searchElement && currentElement !== currentElement)) {
				return true;
			}
			k++;
		}
		return false;
	};
}

// Bootstrap platform
var platform = require('./core/platform.js');

// Determine if debug output is enabled
var debug = false;
if (process.argv[2] === 'debug') {
	process.argv.splice(2, 1);
	debug = true;
	platform.debug = true;
}

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
		if (debug) {
			console.error(e);
			console.trace();
		}
		console.error('Unknown mode \'' + process.argv[2] + '\'');
		process.exit(-1);
	}
	platform.start();
});
