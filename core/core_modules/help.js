var figlet = require.safe('figlet'),

constructHelpMessage = function (help, modules, context) {
    for (var i = 0; i < modules.length; i++) {
        var cmdHelp = modules[i].ignoreHelpContext ?
        modules[i].help(context.commandPrefix) :
        modules[i].help.call(context, context.commandPrefix);
        for (var j = 0; j < cmdHelp.length; j++) {
            help += '→ ' + cmdHelp[j][0] + '\n\t' + cmdHelp[j][1] + '\n';
        }
    }
    return help;
},

checkIfModuleExists = function(modules, moduleName) {
    return modules.find(function(element) {
        return element.name === moduleName;
    });
},

shortSummary = function(context) {
    var help = figlet.textSync(this.packageInfo.name.toProperCase()) + '\n ' + this.packageInfo.version + '\n--------------------\n' +
    this.packageInfo.homepage +  '\n\n';

    help = constructHelpMessage(help, this.coreModules, context);
    return constructHelpMessage(help, this.loadedModules, context);
},

longDescription = function(moduleName, context) {
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
        cmdHelp = module.ignoreHelpContext ?
        module.help(context.commandPrefix) :
        module.help.call(context, context.commandPrefix);

    for (var i = 0; i < cmdHelp.length; i++) {
        var text = cmdHelp[i].length === 3 ? cmdHelp[i][2] : cmdHelp[i][1];
        help += cmdHelp[i][0] + '\n--------------------\n' + text + '\n\n';
    }
    return help;
};

exports.match = function(event, commandPrefix) {
    return event.arguments[0] === commandPrefix + exports.platform.packageInfo.name || event.arguments[0] === commandPrefix + 'help';
};

exports.run = function(api, event) {
    var commands = event.arguments,
        context = {
            commandPrefix: api.commandPrefix
        },
        help;
        
    if (commands.length === 1) {
        help = shortSummary.call(exports.platform, context);
    }
    else {
        commands.splice(0, 1);
        help = longDescription.call(exports.platform, commands.join(' '), context);
    }

    api.sendPrivateMessage(help, event.thread_id, event.sender_id);
    return false;
};

exports.help = function(commandPrefix) {
    return [[commandPrefix + 'help', 'displays this help', 'prints a short summary of all available commands'], [commandPrefix + 'help <query>', 'prints help for a specific module']];
};
