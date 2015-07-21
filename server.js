/** Node.js server configuration for Kassy
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
 */

// Facebook API
var facebook = require('./facebook.js');

// Optional module scripts
var anim = require('./modules/anim.js');
var associate = require('./modules/associate.js');
var disable = require('./modules/disable.js');
var fawlty = require('./modules/fawlty.js');
var karma = require('./modules/karma.js');
var magic8Ball = require('./modules/8Ball.js');
var runbot = require('./modules/runbot.js');
var profound = require('./modules/profound.js');
var slap = require('./modules/slap.js');

// Optional Modules to be included
var modules = [
	anim,
	associate,
	disable,
	fawlty,
	karma,
	magic8Ball,
	runbot,
	profound,
	slap
];

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

// Load Optional Modules
for (var i = 0; i < modules.length; i++) {
	modules[i].load();
}

// Start the all knowing, all extensible kassy bot..
facebook.start('spamme@facebook.com', 'averysecurepassword', function(api, event) {
	if (event.body === '/kassy') {
		var help = 'KASSY 1.1\n--------------------\n' +
			'https://github.com/mrkno/Kassy\n\n';
		for (var i = 0; i < modules.length; i++) {
			help += modules[i].help() + '\n';
		}
		api.sendMessage(help, event.thread_id);
		return;
	}

	for (var i = 0; i < modules.length; i++) {
		if (modules[i].match(event.body, event.thread_id)) {
			modules[i].run(api, event);
			return;
		}
	}
});
