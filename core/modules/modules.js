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
                if (!modules[t].priority || modules[t].priority === 'normal') {
                    modules[t].priority = 0;
                }
                else if (modules[t].priority === 'first') {
                    modules[t].priority = Number.MIN_SAFE_INTEGER;
                }
                else if (modules[t].priority === 'last') {
                    modules[t].priority = Number.MAX_SAFE_INTEGER;
                }
                else {
                    modules[t].priority = 0;
                }
            }
        }
        return modules;
    },

    loadModuleInternal = function (module, platform) {
        try {
            console.write($$`Loading module '${module.name}'... ${(console.isDebug() ? '\n' : '\t')}`);
            var m = loaders[module.__loaderUID].loadModule(module, platform.config);
            m.__loaderPriority = module.priority;
            m.__version = module.version;
            if (module.folderPath) {
                m.__folderPath = module.folderPath;
            }
            m.platform = platform;
            console.info(console.isDebug() ? $$`Loading Succeeded` : $$`[DONE]`);
            return m;
        }
        catch (e) {
            console.error(console.isDebug() ? $$`Loading Failed` : $$`[FAIL]`);
            console.critical(e);
            console.debug($$`Module "${module.name}" could not be loaded.`);
            return null;
        }
    },

    insertSorted = function (module) {
        if (loadedModules.length === 0) {
            loadedModules.push(module);
            return;
        }

        var upper = 0,
            middle = Math.floor(loadedModules.length / 2),
            lower = loadedModules.length - 1;

        while (lower !== middle && upper !== middle) {
            if (module.__loaderPriority === loadedModules[middle].__loaderPriority) {
                break;
            }
            if (module.__loaderPriority < loadedModules[middle].__loaderPriority) {
                lower = middle;
                middle = Math.floor(upper + (lower - upper) / 2);
                if (middle === 0 || lower === middle) {
                    break;
                }
            }
            else {
                upper = middle;
                middle = Math.floor(upper + (lower - upper) / 2);
                if (middle === loadedModules.length - 1 || upper === middle) {
                    middle++;
                    break;
                }
            }
        }
        loadedModules.splice(middle, 0, module);
    };

exports.getLoadedModules = function () {
    return loadedModules;
};

exports.loadModule = function(module, platform) {
    var ld = loadModuleInternal(module, platform);
    if (ld) {
        insertSorted(ld);
        if (ld.load) {
            ld.load.call(ld.platform);
        }
    }
};

exports.loadAllModules = function(platform) {
    var m = listModules();
    for (var mod in m) {
        var ld = loadModuleInternal(m[mod], platform);
        if (ld) {
            insertSorted(ld);
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
        console.debug($$`Unloading module "${mod.name}".`);
        if (mod.unload) {
            mod.unload();
        }
        if (mod.config) {
            config.saveModuleConfig(mod.name);
        }
        mod.platform = null;
        var index = loadedModules.indexOf(mod);
        loadedModules.splice(index, 1);
        if (!mod.__coreOnly) {
            $$.removeContextIfExists(mod.name);
        }
    }
    catch (e) {
        console.error($$`Unloading module "${mod.name}" failed.`);
        console.critical(e);
    }
    return null;
};

exports.unloadAllModules = function(config) {
    while (loadedModules.length > 0) {
        exports.unloadModule(loadedModules[0], config);
    }
};
