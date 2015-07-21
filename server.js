var facebook = require('./facebook.js'),
	karma = require('./modules/karma.js'),
	runbot = require('./modules/runbot.js'),
	anim = require('./modules/anim.js'),
	magic8Ball = require('./modules/8Ball.js'),
	disable = require('./modules/disable.js'),
	associate = require('./modules/associate.js'),
	fawlty = require('./modules/fawlty.js'),
	profound = require('./modules/profound.js'),
	modules = [disable,karma,runbot,anim,magic8Ball,fawlty,profound,associate];
	
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
	
// Startup
for (var i = 0; i < modules.length; i++) {
	modules[i].load();
}

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
