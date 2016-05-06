var figlet = require.safe('figlet'),

constructHelpMessage = function(help, modules, context, prefix) {
	for (var i = 0; i < modules.length; i++) {
		var cmdHelp = modules[i].help.call(context, prefix);
		for (var j = 0; j < cmdHelp.length; j++) {
			help += '→ ' + cmdHelp[j][0] + '\n\t' + cmdHelp[j][1] + '\n';
		}
	}
	return help;
},

checkIfModuleExists = function(modules, moduleName) {
	return modules.find(function(element, index, array) {
		return element.name === moduleName;
	});
},

shortSummary = function(prefix) {
	var help = figlet.textSync(this.packageInfo.name.toProperCase()) + '\n '
		+ this.packageInfo.version + '\n--------------------\n'
		+ this.packageInfo.homepage +  '\n\n';

	/* Deprecated */
	var context = {
		commandPrefix: prefix
	};

	help = constructHelpMessage(help, this.coreModules, context, prefix);
	return constructHelpMessage(help, this.loadedModules, context, prefix);
},

longDescription = function (moduleName, prefix) {
	var module = checkIfModuleExists(this.coreModules, moduleName);

	if (!module || module.length === 0) {
		// Check loaded modules, as commnd not in core modules
		module = checkIfModuleExists(this.loadedModules, moduleName);
	}
	
	if (!module || module.length === 0) {
		return 'Cannot provide help on module that was not found. Has it been disabled?';
	}
	
	if (module.length > 1) {
		return 'More than one module has the same name. Please fix this before continuing.';
	}

	var help = '',
		context = {
			commandPrefix: prefix
		},
		cmdHelp = module.help.call(context, prefix);
		
	for (var i = 0; i < cmdHelp.length; i++) {
		var text = cmdHelp[i].length === 3 ? cmdHelp[i][2] : cmdHelp[i][1];
		help += cmdHelp[i][0] + '\n--------------------\n' + text + '\n\n';
	}
	return help;
};

exports.match = function(event, commandPrefix) {
    return event.arguments[0] === commandPrefix + exports.platform.packageInfo.name
        || event.arguments[0] === commandPrefix + 'help';
};

exports.run = function(api, event) {
	var commands = event.arguments,
		help;
		
	if (commands.length === 1) {
		help = shortSummary.call(exports.platform, api.commandPrefix);
	}
	else {
		commands.splice(0, 1);
		help = longDescription.call(exports.platform, commands.join(' '), api.commandPrefix);
	}
	
	api.sendPrivateMessage(help, event.thread_id, event.sender_id);
	return false;
};

exports.help = function(commandPrefix) {
	return [[commandPrefix + 'help','displays this help', 'prints a short summary of all available commands'], [commandPrefix + 'help <query>', 'prints help for a specific module']];
};
