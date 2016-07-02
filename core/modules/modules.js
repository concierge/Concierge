/**
 * Provides helper functions for handling user and system modules.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

var loaders         = [require.once('./kassyModule.js'), require.once('./hubotModule.js')],
    conflict        = 1,
    loadedModules   = [],

    listModules = function (disabled) {
        var modules = {};
        for (var i = 0; i < loaders.length; i++) {
            var m = loaders[i].listModules(disabled);
            for (var key in m) {
                var t = key;
                while (modules[t]) {
                    t = key + conflict++;
                }
                modules[t] = m[key];
                modules[t].__loaderUID = i;
            }
        }
        return modules;
    },

    loadModuleInternal = function (module, platform) {
        try {
            console.write('Loading module \'' + module.name + '\'... ' + (console.isDebug() ? '\n' : ''));
            var m = loaders[module.__loaderUID].loadModule(module, platform.config);
            m.__loaderPriority = module.priority;
            m.platform = platform;
            console.info(console.isDebug() ? 'Loading Succeeded' : '\t[DONE]');
            return m;
        }
        catch (e) {
            console.error(console.isDebug() ? 'Loading Failed' : '\t[FAIL]');
            console.critical(e);
            console.debug('Module "' + module.name + '" could not be loaded.');
            return null;
        }
    };

exports.getLoadedModules = function () {
    return loadedModules;
};

exports.loadModule = function (module, platform) {
    var ld = loadModuleInternal(module, platform);
    if (ld) {
        loadedModules.push(ld);
        if (ld.load) {
            ld.load.call(ld.platform);
        }
    }
}

exports.loadAllModules = function(platform) {
    var m = listModules();
    for (var mod in m) {
        var ld = loadModuleInternal(m[mod], platform);
        if (ld) {
            loadedModules.push(ld);
        }
    }

    for (var i = 0; i < loadedModules.length; i++) {
        if (loadedModules[i].load) {
            loadedModules[i].load.call(loadedModules[i].platform);
        }
    }
};

exports.verifyModule = function (path, disabled) {
    var mod = null;
    for (var i = 0; i < loaders.length; i++) {
        mod = loaders[i].verifyModule(path, disabled);
        if (mod) {
            if (!mod.priority || mod.priority === 'normal') {
                mod.priority = 0;
            }
            else if (mod.priority === 'first') {
                mod.priority = Number.MIN_SAFE_INTEGER;
            }
            else if (mod.priority === 'last') {
                mod.priority = Number.MAX_SAFE_INTEGER;
            }
            else if (typeof mod.priority !== 'number') {
                continue;
            }
            mod.__loaderUID = i;
            break;
        }
    }
    return mod;
};

exports.unloadModule = function(mod, config) {
    try {
        console.debug('Unloading module "' + mod.name + '".');
        if (mod.unload) {
            mod.unload();
        }
        if (mod.config) {
            config.saveModuleConfig(mod.name);
        }
        mod.platform = null;
        var index = loadedModules.indexOf(mod);
        loadedModules.splice(index, 1);
    }
    catch (e) {
        console.error('Unloading module "' + mod.name + '" failed.');
        console.critical(e);
    }
    return null;
};

exports.unloadModuleByName = function (name, platform) {
    var module = loadedModules.find(function(mod) {
        return mod.name.trim().toLowerCase() === name.trim().toLowerCase();
    });

    exports.unloadModule(module, platform.config);
};

exports.unloadAllModules = function(config) {
    while (loadedModules.length > 0) {
        exports.unloadModule(loadedModules[0], config);
    }
};
