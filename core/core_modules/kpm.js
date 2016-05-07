var git = require.once('../git.js'),
    files = require.once('../files.js'),
    cfg = require.once('../config.js'),
    path = require('path'),
    fs = require.safe('fs-extra'),
    rmdir = require.safe('rimraf'),
    tmp = require.safe('tmp'),
    sanitize = require.safe('sanitize-filename'),
    request = require('request'),
    urll = require('url'),
    moduleCache = null,
    moduleTable = {
        lastUpdated: null,
        modules: {}
    },
    opts = {
        help: {
            run: function(args, api, event) {
                if (args.length > 1) {
                    api.sendMessage('You can only show detailed help for one command at a time.', event.thread_id);
                    return;
                }
                var msg;
                if (args.length === 1) {
                    if (!opts[args[0]] || args[0] === 'help') {
                        api.sendMessage('No such command to show help for.', event.thread_id);
                        return;
                    }
                    msg = opts[args[0]].command + '\n--------------------\n' + opts[args[0]].detailedHelp;
                    api.sendMessage(msg, event.thread_id);
                }
                else {
                    msg = '';
                    for (var opt in opts) {
                        if (opt === 'help') continue;
                        msg += opts[opt].command + '\n\t' + opts[opt].help + '\n';
                    }
                    api.sendMessage(msg, event.thread_id);
                }
            },
            command: 'help [<command>]'
        },
        install: {
            run: function(args, api, event) {
                if (args.length === 0) {
                    api.sendMessage('Nothing provided to install!', event.thread_id);
                    return;
                }

                for (var i = 0; i < args.length; i++) {
                    var url = args[i];
                    if (url.startsWith('ssh') || url.endsWith('.git')) {
                        gitInstall.call(this, url, api, event);
                        continue;
                    }
                    else if (url.startsWith('http') && (url.endsWith('.coffee') || url.endsWith('.js'))) {
                        scriptInstall.call(this, url, api, event);
                        continue;
                    }

                    var spl = url.split('/');
                    if (spl.length === 1) {
                        refreshModuleTable(url, function(url, err) {
                            if (err || !moduleTable.modules[url]) {
                                api.sendMessage('Invalid KPM table reference provided "' + url + '". Skipping...', event.thread_id);
                                return;
                            }
                            url = moduleTable.modules[url];
                            gitInstall.call(this, url, api, event);
                        }.bind(this));
                    }
                    else if (spl.length === 2) {
                        url = 'https://github.com/' + url.trim();
                        gitInstall.call(this, url, api, event);
                    }
                    else {
                        api.sendMessage('Invalid KPM module provided "' + url + '". Skipping...', event.thread_id);
                    }
                }
            },
            command: 'install <url|ref> [<url|ref> [<url|ref> [...]]]',
            help: 'Installs one or more modules from exising git repositories or github references.',
            detailedHelp: 'Installs one or more modules from existing git repositories or github references if ones of the same name do not already exist.'
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
            var mods = exports.platform.modulesLoader.listModules(true);
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
        git.pullWithPath(module.folderPath, function (err) {
            if (err) {
                api.sendMessage('Update failed. Manual intervention is probably required.', event.thread_id);
            } else {
                api.sendMessage('Restarting module "' + module.name + '"...', event.thread_id);
                // unload the current version
                this.loadedModules = this.loadedModules.filter(function (value) {
                    if (value.name !== module.name) {
                        return true;
                    }
                    exports.platform.modulesLoader.unloadModule(value);
                    return false;
                });
                delete moduleCache[module.name];

                // load new module copy
                var descriptor = exports.platform.modulesLoader.verifyModule(module.folderPath),
                    m = exports.platform.modulesLoader.loadModule(descriptor);
                if (m !== null) {
                    moduleCache[descriptor.name] = descriptor;
                    exports.platform.loadedModules.push(m);
                    api.sendMessage('"' + module.name + '" is now at version ' + module.version + '.', event.thread_id);
                } else {
                    api.sendMessage('Loading updated "' + module.name + '" failed. Manual intervention will be required.', event.thread_id);
                }
            }
        }.bind(this));
    },

    uninstall = function(module, api, event) {
        api.sendMessage('Unloading module "' + module.name + '"...', event.thread_id);
        // unload the current version
        this.loadedModules = this.loadedModules.filter(function (value) {
            if (value.name !== module.name) {
                return true;
            }
            exports.platform.modulesLoader.unloadModule(value);
            return false;
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
    },
    installCommon = function (name, moduleLocation, cleanup, api, event) {
        try {
            var descriptor = exports.platform.modulesLoader.verifyModule(moduleLocation),
                moduleList = getModuleList();

            if (!descriptor) {
                api.sendMessage('"' + name + '" is not a valid module/script.', event.thread_id);
                cleanup();
                return;
            }

            if (exports.platform.loadedModules[descriptor.name] || moduleList[descriptor.name] || moduleList['kpm_' + descriptor.name]) {
                api.sendMessage('A module with name or directory "' + descriptor.name + '" has already been installed.', event.thread_id);
                cleanup();
                return;
            }

            descriptor.safeName = sanitize(descriptor.name);
            var instDir = path.resolve('./modules/kpm_' + descriptor.safeName);
            fs.copy(moduleLocation, instDir, function (err) {
                if (err) {
                    console.debug(err);
                    api.sendMessage('An unknown error occurred while installing "' + descriptor.name + '".', event.thread_id);
                    cleanup();
                    return;
                }

                descriptor.folderPath = instDir;
                var m = exports.platform.modulesLoader.loadModule(descriptor);
                if (m !== null) {
                    moduleCache[descriptor.name] = descriptor;
                    exports.platform.loadedModules.push(m);
                    api.sendMessage('"' + descriptor.name + '" (' + descriptor.version + ') is now installed.', event.thread_id);
                }
                else {
                    api.sendMessage('"' + descriptor.name + '" (' + descriptor.version + ') could not be installed, it appears to be invalid (syntax error?).', event.thread_id);
                    fs.emptyDir(descriptor.folderPath, function () {
                        // just delete if we can, not a lot we can do about errors here.
                    });
                }
                cleanup();
            });
        }
        catch (e) {
            console.critical(e);
            api.sendMessage('Could not install "' + name + '".', event.thread_id);
            cleanup();
        }
    },

    gitInstall = function(url, api, event) {
        api.sendMessage('Attempting to install module from "' + url + '"...', event.thread_id);
        tmp.dir(function (err, dir, cleanupCallback) {
            if (err) throw err;
            var cleanup = function(){
                fs.emptyDir(dir, function () {
                    cleanupCallback(); // not a lot we can do about errors here.
                });
            }.bind(this);

            git.clone(url, dir, function (err1) {
                if (err1) {
                    console.critical(err1);
                    cleanup();
                    return api.sendMessage('Failed to install module from "' + url + '"...', event.thread_id);
                }
                var parsed = urll.parse(url),
                    cleaned = sanitize(path.basename(parsed.pathname));
                return installCommon(cleaned, dir, cleanup, api, event);
            });
        }.bind(this));
    },

    scriptInstall = function (url, api, event) {
        api.sendMessage('Attempting to install script from "' + url + '"...', event.thread_id);
        tmp.dir(function(err, dir, cleanupCallback) {
            if (err) throw err;
            var cleanup = function() {
                fs.emptyDir(dir, function() {
                    cleanupCallback(); // not a lot we can do about errors here.
                });
            }.bind(this);

            var parsed = urll.parse(url),
                cleaned = sanitize(path.basename(parsed.pathname));
            request.get({ url: url }, function(error, response, body) {
                if (err) {
                    console.critical(err);
                    cleanup();
                    return api.sendMessage('Failed to install "' + cleaned + '"...', event.thread_id);
                }

                fs.writeFileSync(path.join(dir, cleaned), body, 'utf8');
                return installCommon(cleaned, dir, cleanup, api, event);
            });
        });
    },

    refreshModuleTable = function (url, callback) {
        var hr = 3600000;
        if (moduleTable.lastUpdated != null && new Date() - moduleTable.lastUpdated < hr) {
            return callback(url);
        }

        request.get('https://raw.githubusercontent.com/wiki/mrkno/Kassy/KPM-Table.md', function (error, response) {
            if (response.statusCode === 200 && response.body) {
                var b = response.body;
                if (b && b.length > 0) {
                    var spl = b.split('\n'),
                        shouldParse = false,
                        foundModules = {};
                    for (var i = 0; i < spl.length; i++) {
                        if (!spl[i].startsWith('|')) {
                            continue;
                        }

                        var items = spl[i].split('|');
                        if (items.length !== 4) {
                            continue;
                        }
                        if (!shouldParse) {
                            if (items[1] === '---' && items[2] === '---') {
                                shouldParse = true;
                            }
                            continue;
                        }
                        foundModules[items[1]] = items[2];
                    }
                    moduleTable.modules = foundModules;
                    moduleTable.lastUpdated = new Date();
                }
                callback(url);
            }
            else {
                callback(url, 'Could not update the list of KPM entries. Module entries may not be up to date.');
            }
        });
    };

exports.match = function (event, commandPrefix) {
    return event.arguments[0] === commandPrefix + 'kpm';
};

exports.run = function (api, event) {
    var commands = event.arguments;
    var command = commands.length >= 2 ? commands[1].toLowerCase() : null;
    if (command == null || !opts[command]) {
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

exports.help = function(commandPrefix) {
    return [[commandPrefix + 'kpm','Kassy Package Manager, for installing external kpm modules', 'For detailed help on specific kpm commands run ' + commandPrefix + 'kpm help']];
};
