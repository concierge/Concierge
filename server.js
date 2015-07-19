var facebook = require('./facebook.js'),
	karma = require('./karma.js'),
	runbot = require('./runbot.js'),
	anim = require('./anim.js'),
	modules = [karma,runbot,anim];
	
// Startup
for (var i = 0; i < modules.length; i++) {
	modules[i].load();
}

facebook.start('spamme@facebook.com', 'averysecurepassword', function(api, event) {
	if (event.body === '/kassy') {
		var help = 'KASSY COMMANDS\n--------------------\n';
		for (var i = 0; i < modules.length; i++) {
			help += modules[i].help() + '\n';
		}
		api.sendMessage(help, event.thread_id);
		return;
	}
	
	for (var i = 0; i < modules.length; i++) {
		if (modules[i].match(event.body)) {
			modules[i].run(api, event);
			return;
		}
	}
});