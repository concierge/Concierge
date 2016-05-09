/**
 * Provides a means to install missing dependencies at runtime.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

var npm = require('npm'),
	deasync = require('deasync'),
	fs = require('fs'),
	load = deasync(npm.load);

load({loglevel: 'silent'});
var inst = deasync(npm.commands.install),
upd = deasync(npm.commands.update),

install = function(name) {
	console.info('Installing \"' + name + '\" from npm.');
	inst([name]);
	console.info('Installation complete.');
};

exports.requireOrInstall = function(req, name) {
	try {
		return req(name);
	}
	catch (e) {
		if (!e || !e.code || e.code !== 'MODULE_NOT_FOUND') {
			throw e;
		}
		try {
			fs.statSync(name);
		}
		catch (p) {
			install(name);
		}
	}

	return req(name);
};

exports.update = function() {
	upd([]);
};
