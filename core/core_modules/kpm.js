var gitpull = require.safe('git-pull'),
    files = require.once('../files.js'),
    modules = require.once('../modules.js'),
    path = require('path'),
    rmdir = require('rimraf'),
    moduleCache = null,
    opts = {
        install: {
            run: function(args, api, event) {

            },
            command: 'install <gitUrl> [<gitUrl> [<gitUrl> [...]]]',
            help: 'Installs one or more modules from exising git repositories.',
            detailedHelp: 'Installs one or more modules from existing git repositories if ones of the same name do not already exist.'
        },

        uninstall: {
            run: function(args, api, event) {
                var uninstallMods = parseRuntimeModuleList(args, 'uninstall', api, event);
                for (var m in uninstallMods) {
                    uninstall.call(this, uninstallMods[m], api, event);
                }
            },
            command: 'uninstall [<moduleName> [<moduleName> [...]]]',
            help: 'Uninstalls one or more modules.',
            detailedHelp: 'Uninstalls one or more modules that were installed using Kassy Package Manager or uninstalls all modules if a list was not provided. Will not uninstall preinstalled modules.'
        },

        update: {
            run: function(args, api, event) {
                var updateMods = parseRuntimeModuleList(args, 'update', api, event);
                for (var m in updateMods) {
                    update.call(this, updateMods[m], api, event);
                }
            },
            command: 'update [<moduleName> [<moduleName> [...]]]',
            help: 'Updates one or all modules.',
            detailedHelp: 'Updates all modules that were installed using Kassy Package Manager or if a module name was provided updates that module.'
        },

        list: {
            run: function(args, api, event) {
                if (args.length > 0) {
                    api.sendMessage('List does not take any arguments', event.thread_id);
                    return;
                }

                var l = 'Installed KPM modules are:\n';
                var mods = Object.keys(getModuleList());
                for (var i = 0; i < mods.length; i++) {
                    l += '\t- ' + mods[i] + '\n';
                }
                if (mods.length === 0) {
                    l += 'No modules currently installed using KPM.\n';
                }
                api.sendMessage(l, event.thread_id);
            },
            command: 'list',
            help: 'Lists all installed modules (except preinstalled ones).',
            detailedHelp: 'Lists all modules that have been installed using Kassy Package Manager.'
        }
    },

    getModuleList = function(cacheOverride) {
        if (cacheOverride === true || moduleCache === null) {
            var mods = modules.listModules(true);
            for (var m in mods) {
                var s = mods[m].folderPath.split(path.sep);
                if (!s[s.length - 1].startsWith('kpm_')) {
                    delete mods[m];
                }
            }
            moduleCache = mods;
        }
        return moduleCache;
    },

    parseRuntimeModuleList = function(args, cmd, api, event) {
        var updateMods = getModuleList();
        if (args.length > 0) {
            var m = {};
            for (var i = 0; i < args.length; i++) {
                if (!isModuleName(args[i])) {
                    api.sendMessage('"' + args[i] + '" is not an installed module.', event.thread_id);
                    return null;
                }
                m[args[i]] = updateMods[args[i]];
            }
            updateMods = m;
        }
        if (Object.keys(updateMods).length === 0) {
            api.sendMessage('No modules are installed to ' + cmd + '.', event.thread_id);
            return null;
        }
        return updateMods;
    };

    isModuleName = function(name) {
        return getModuleList()[name] ? true : false;
    },

    update = function (module, api, event) {
        api.sendMessage('Updating "' + module.name + '" (' + module.version + ')...', event.thread_id);
        gitpull(module.folderPath, function (err, consoleOutput) {
            if (err) {
                api.sendMessage('Update failed. Manual intervention is probably required.', event.thread_id);
            } else {
                api.sendMessage('Restarting module "' + module.name + '"...');
                // unload the current version
                this.loadedModules = this.loadedModules.filter(function (value) {
                    if (value.name === module.name) {
                        // TODO: save configuration
                        if (value.unload) {
                            value.unload();
                        }
                        return false;
                    }
                    return true;
                });
                
                // load new module copy
                delete moduleCache[module.name]; 
                moduleCache[module.name] = require.once(path.join(module.folderPath, 'kassy.json'));
                module = moduleCache[module.name];
                this.loadedModules.push(modules.loadModule(module));

                api.sendMessage('"' + module.name + '" is now at version ' + module.version + '.', event.thread_id);
            }
        });
    },

    uninstall = function(module, api, event) {
        api.sendMessage('Unloading module "' + module.name + '"...', event.thread_id);
        // unload the current version
        this.loadedModules = this.loadedModules.filter(function (value) {
            if (value.name === module.name) {
                if (value.unload) {
                    value.unload();
                }
                return false;
            }
            return true;
        });
    
        delete moduleCache[module.name];
        rmdir(module.folderPath, function (error) {
            if (error) {
                console.debug(error);
                api.sendMessage('Failed to delete module "' + module.name + '".', event.thread_id);
            } else {
                api.sendMessage('Uninstalled module "' + module.name + '".', event.thread_id);
            }
        });
    };

exports.match = function (text, commandPrefix) {
    console.log(commandPrefix);
    return text.startsWith(commandPrefix + 'kpm');
};

exports.run = function (api, event) {
    var commands = event.body.split(' ');
    var command = null;
    if (commands.length < 2 || !opts[(command = commands[1].toLowerCase())]) {
        var t = 'Invalid usage of Kassy Package Manager. Options are:\n';
        for (var opt in opts) {
            t += '\t- ' + opts[opt].command + '\n';
        }
        api.sendMessage(t, event.thread_id);
        return false;
    }
    
    commands.splice(0, 2);
    opts[command].run.call(this, commands, api, event);

    return false;
};