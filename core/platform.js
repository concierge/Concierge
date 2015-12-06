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

var figlet = require('figlet'),
 
Platform = function(modes) {
	require.reload('./prototypes.js');
	
	this.config			= require('./config.js');
	this.loadedModules	= [];
	this.coreModules	= [];
	this.modes			= null;
	this.defaultPrefix	= '/';
	this.packageInfo	= require.once('../package.json');
	this.modules		= require.once('./modules.js');
	this.statusFlag		= StatusFlag.NotStarted;
	this.onShutdown		= null;
	this.waitingTime	= 250;

	this.packageInfo.name = this.packageInfo.name.toProperCase();
	this.setModes(modes);
};

Platform.prototype.handleTransaction = function(module, args) {
	var returnVal = true,
		timeout = setTimeout(function() {
			if (returnVal !== true) {
				return;
			}
			args[0].sendTyping(args[1].thread_id);
		}, this.waitingTime);
	returnVal = module.run.apply(module, args);
	clearTimeout(timeout);
};

Platform.prototype.messageRxd = function(api, event) {
	var matchArgs	= [event.body, api.commandPrefix, event.thread_id, event.sender_name],
		runArgs		= [api, event],
		abort		= false;

	// Run core modules in platform mode
	for (var i = 0; i < this.coreModules.length; i++) {
        if (this.coreModules[i].match.apply(this, matchArgs)) {
            var temp = !this.coreModules[i].run.apply(this, runArgs);
			abort = abort || temp;
		}
	}
	if (abort) {
		return;
	}

	// Run user modules in protected mode
	for (var i = 0; i < this.loadedModules.length; i++) {
		if (this.loadedModules[i].match.apply(this.loadedModules[i], matchArgs)) {
			try {
				this.handleTransaction(this.loadedModules[i], runArgs);
			}
			catch (e) {
                api.sendMessage(event.body + ' fucked up. Damn you ' + event.sender_name + ".", event.thread_id);
			    console.critical(e);
			}
			return;
		}
	}
};

Platform.prototype.setModes = function(modes) {
    try {
        if (this.statusFlag !== StatusFlag.NotStarted) {
            throw 'Cannot change mode when it is already started.';
        }
		this.modes = [];
		for (var i = 0; i < modes.length; i++) {
			var mode = {
				instance: require.once('./output/' + modes[i]),
				name: modes[i]
			};
			this.modes.push(mode);
		}
        return true;
    }
    catch (e) {
        console.critical(e);
        console.error('Loading the output mode file \'' + newMode + '\' failed.' +
            '\n\nIf this is your file please ensure that it is syntatically correct.');
        return false;
    }
};

Platform.prototype.start = function() {
	if (this.statusFlag !== StatusFlag.NotStarted) {
		throw 'Cannot start platform when it is already started.';
	}
	if (!this.modes.length) {
		throw 'Modes must be set before starting';
    }

	console.title(figlet.textSync(this.packageInfo.name.toProperCase()));
	
    console.title(' ' + this.packageInfo.version);
    console.info('------------------------------------');
    console.warn('Starting system...\n'
				+ 'Loading system configuration...');

    this.modules.disabledConfig = this.config.loadDisabledConfig();
	for (var i = 0; i < this.modes.length; i++) {
		this.modes[i].instance.platform = this;
		this.modes[i].instance.config = this.config.loadOutputConfig(this.modes[i].name);
		if (!this.modes[i].instance.config.commandPrefix) {
			this.modes[i].instance.config.commandPrefix = this.defaultPrefix;
		}
	}
    
	// Load core modules
    console.warn('Loading core components...');
    this.modules.listCoreModules(function (m) {		
        for (var i = 0; i < m.length; i++) {
            this.coreModules.push(this.modules.loadCoreModule(this, m[i]));
        }
    }.bind(this));

	// Load Kassy modules
	console.warn('Loading modules...');
    this.modules.listModules(function (m) {
        for (var mod in m) {
            this.loadedModules.push(this.modules.loadModule(m[mod]));
        }
    }.bind(this));
        
	// Starting output
	console.warn('Starting integrations...');
	for (var i = 0; i < this.modes.length; i++) {
		try {
			console.write("Loading output '" + this.modes[i].name + "'...\t");
			this.modes[i].instance.start(this.messageRxd.bind(this));
			console.info("[DONE]");
		}
		catch (e) {
			console.error("[FAIL]");
			console.debug("Failed to start output integration '" + this.modes[i].name + "'.");
			console.critical(e);
		}
	}
	
    this.statusFlag = StatusFlag.Started;
    console.warn('System has started. ' + 'Hello World!'.rainbow);
};

Platform.prototype.shutdown = function(flag) {
    if (this.statusFlag !== StatusFlag.Started) {
        throw 'Cannot shutdown platform when it is not started.';
    }
	if (!flag) {
		flag = 0;
	}

	// Stop output modes
	for (var i = 0; i < this.modes.length; i++) {
		try {
			this.modes[i].instance.stop();
		}
		catch (e) {
			console.debug("Failed to correctly stop output mode '" + this.modes[i] + "'.");
			console.critical(e);
		}
	}
	
    // Unload user modules
    for (var i = 0; i < this.loadedModules.length; i++) {
        if (this.loadedModules[i].unload) {
            this.loadedModules[i].unload();
        }
        this.loadedModules[i] = null;
    }
    this.loadedModules = [];

    // Unload core modules
    for (var i = 0; i < this.coreModules.length; i++) {
        if (this.coreModules[i].unload) {
            this.coreModules[i].unload();
        }
        this.coreModules[i] = null;
    }
    this.coreModules = [];

	this.config.saveConfig();
	this.statusFlag = flag ? flag : StatusFlag.Shutdown;
	
	console.warn(this.packageInfo.name + " has shutdown.");
	if (this.onShutdown && this.onShutdown != null) {
		this.onShutdown(this.statusFlag);
	}
};

Platform.prototype.setOnShutdown = function(onShutdown) {
	this.onShutdown = onShutdown;
};

module.exports = Platform;
