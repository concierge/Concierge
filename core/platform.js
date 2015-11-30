/**
 * Main platform. Handles the core interop of the program and
 * acts as the glue code for the various parts of the code.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

// Setup file scope variables
var config			= require('./config.js'),
	path			= require('path'),
    fs              = require('fs'),
	configFile		= 'config.json',
	started			= false,
	loadedModules	= [],
	coreModules		= [],
	mode			= null;

// Load core files
require('./prototypes.js');
require('./require.js');

modules = require('./modules.js');

// Setup platform scope variables
exports.require_install = require('require-install');
exports.commandPrefix = '/';
exports.packageInfo = require('../package.json');
exports.loadedModules = loadedModules; // pointer for core modules

// Correct title case
exports.packageInfo.name = exports.packageInfo.name.toProperCase();

exports.messageRxd = function(api, event) {
	var matchArgs	= [event.body, event.thread_id, event.sender_name],
		runArgs		= [api, event],
		abort		= false;

	// Run core modules in platform mode
	for (var i = 0; i < coreModules.length; i++) {
        if (coreModules[i].match.apply(exports, matchArgs)) {
            var temp = !coreModules[i].run.apply(exports, runArgs);
			abort = abort || temp;
		}
	}
	if (abort) {
		return;
	}

	// Run user modules in protected mode
	for (var i = 0; i < loadedModules.length; i++) {
		if (loadedModules[i].match.apply(loadedModules[i], matchArgs)) {
			try {
				api.sendTyping(event.thread_id);
				loadedModules[i].run.apply(loadedModules[i], runArgs);
			}
			catch (e) {
                api.sendMessage(event.body + ' fucked up. Damn you ' + event.sender_name + ".", event.thread_id);
			    console.critical(e);
			}
			return;
		}
	}
};

exports.setMode = function(newMode) {
    try {
        if (started) {
            throw 'Cannot change mode when it is already started.';
        }
        mode = require('./output/' + newMode);
        return true;
    }
    catch (e) {
        console.critical(e);
        console.error('Loading the output mode file \'' + newMode + '\' failed.' +
            '\n\nIf this is your file please ensure that it is syntatically correct.');
        return false;
    }
};

exports.start = function() {
	if (started) {
		throw 'Cannot start platform when it is already started.';
	}
	if (!mode) {
		throw 'Mode must be set before starting';
    }
    mode.platform = exports;

    console.title(exports.packageInfo.name.toProperCase() + ' ' + exports.packageInfo.version);
    console.info('------------------------------------');
    console.warn('Starting system...\n'
				+ 'Loading system configuration...');

    mode.config = config.loadOutputConfig();
    modules.config = config.loadDisabledConfig();

	if (mode.config.commandPrefix) {
		exports.commandPrefix = mode.config.commandPrefix;
	}
	else {
		mode.config.commandPrefix = exports.commandPrefix;
	}
	modules.commandPrefix = exports.commandPrefix;

	// Load core modules
    console.warn('Loading core components...');
    modules.listCoreModules(function (m) {
        for (var i = 0; i < m.length; i++) {
            coreModules.push(modules.loadCoreModule(exports, m[i]));
        }
    });

	// Load Kassy modules
	console.warn('Loading modules...');
    modules.listModules(function (m) {
        for (var mod in m) {
            loadedModules.push(modules.loadModule(m[mod]));
        }
    });
        
    // Start output
    mode.start(exports.messageRxd);
    started = true;
    console.warn('System has started. ' + 'Hello World!'.rainbow);
};

exports.shutdown = function(callback) {
    if (!started) {
        throw 'Cannot shutdown platform when it is not started.';
    }

    // Unload user modules
    for (var i = 0; i < loadedModules.length; i++) {
        if (loadedModules[i].unload) {
            loadedModules[i].unload();
        }
        loadedModules[i] = null;
    }
    loadedModules = [];

    // Unload core modules
    for (var i = 0; i < coreModules.length; i++) {
        if (coreModules[i].unload) {
            coreModules[i].unload();
        }
        coreModules[i] = null;
    }
    coreModules = [];

    mode.stop();

	config.saveConfig();
	started = false;
	console.log(exports.packageInfo.name + " has shutdown.");
	if (callback) {
		callback();
	}
};

exports.restart = function() {
	exports.shutdown(function() {
		exports.start();
	});
};
