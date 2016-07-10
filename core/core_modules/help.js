let constructHelpMessage = function (help, modules, context, event) {
    for (var i = 0; i < modules.length; i++) {
        var cmdHelp = modules[i].ignoreHelpContext ?
        modules[i].help(context.commandPrefix, event) :
        modules[i].help.call(context, context.commandPrefix, event);
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

shortSummary = function(context, event) {
    var help = this.packageInfo.name.toProperCase() + ' [' + this.packageInfo.version +
        ']\n--------------------\n' + this.packageInfo.homepage +  '\n\n';

    return constructHelpMessage(help, this.modulesLoader.getLoadedModules(), context, event);
},

longDescription = function(moduleName, context, event) {
    var module = checkIfModuleExists(this.modulesLoader.getLoadedModules(), moduleName);

    if (!module || module.length === 0) {
        return $$`No help found`;
    }

    if (module.length > 1) {
        return $$`Multiple different help results`;
    }

    var help = '',
        cmdHelp = module.ignoreHelpContext ?
        module.help(context.commandPrefix, event) :
        module.help.call(context, context.commandPrefix, event);

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
        help = shortSummary.call(exports.platform, context, event);
    }
    else {
        commands.splice(0, 1);
        help = longDescription.call(exports.platform, commands.join(' '), context, event);
    }

    api.sendPrivateMessage(help, event.thread_id, event.sender_id);
    return true;
};

exports.help = function(commandPrefix) {
    return [
        [commandPrefix + 'help', $$`Displays this help`, $$`Prints a short summary of all available commands with help`],
        [commandPrefix + 'help <query>', $$`Prints help for a specific module`]
    ];
};
