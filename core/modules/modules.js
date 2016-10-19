/**
 * Provides helper functions for handling user and system modules.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2016.
 */

let loaders         = [require.once('./kassy/kassyModule.js'), require.once('./hubot/hubotModule.js')],
    files           = require.once(rootPathJoin('core/files.js')),
    path            = require('path'),
    loaded          = {},

    loadModuleInternal = (module, platform) => {
        try {
            console.write($$`Loading module '${module.name}'... ${(console.isDebug() ? '\n' : '\t')}`);
            const m = loaders[module.__loaderUID].loadModule(module, platform.config);
            m.__descriptor = module;
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

    insertSorted = (module) => {
        for (let type of module.__descriptor.type) {
            if (!loaded[type]) loaded[type] = [];
            const loadedModules = loaded[type];
            if (loadedModules.length === 0) {
                loadedModules.push(module);
                return;
            }

            let upper = 0,
                middle = Math.floor(loadedModules.length / 2),
                lower = loadedModules.length - 1;

            while (lower !== middle && upper !== middle) {
                if (module.__descriptor.priority === loadedModules[middle].__descriptor.priority) {
                    break;
                }
                if (module.__descriptor.priority < loadedModules[middle].__descriptor.priority) {
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
        }
    };

exports.getLoadedModules = (type) => {
    return loaded[type] || [];
};

exports.loadModule = (module, platform) => {
    const ld = loadModuleInternal(module, platform);
    if (!ld) return;
    insertSorted(ld);
    if (module.__descriptor.type.includes('integration') && !module.config.commandPrefix) {
        module.config.commandPrefix = platform.defaultPrefix;
    }
    if (ld.load) ld.load.call(ld.platform);
};

exports.loadAllModules = (platform) => {
    const data = files.filesInDirectory(global.__modulesPath);

    for (let i = 0; i < data.length; i++) {
        try {
            const candidate = path.resolve(path.join(global.__modulesPath, data[i])),
                output = exports.verifyModule(candidate);
            if (output) {
                exports.loadModule(output, platform);
            }
            else {
                console.debug($$`Skipping "${data[i]}". It isn't a module.`);
            }
        }
        catch (e) {
            console.debug($$`A failure occured while listing "${data[i]}". It doesn't appear to be a module.`);
            console.critical(e);
            continue;
        }
    }
};

exports.startIntegration = (callback, integration) => {
    if (typeof (integration) === 'string') {
        const filtered = loaded.integration.filter(val => val.__descriptor.name === integration);
        if (filtered.length !== 1) {
            throw new Error('Cannot find integration to start.');
        }
        integration = filtered[0];
    }

    if (integration.__running) {
        throw new Error('The specified integration is already running.');
    }

    integration.__running = true;
    integration.start((api, event) => {
        event.event_source = integration.__descriptor.name;
        callback(api, event);
    });
};

exports.verifyModule = (path) => {
    for (let i = 0; i < loaders.length; i++) {
        const mod = loaders[i].verifyModule(path);
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
            return mod;
        }
    }
    return null;
};

exports.unloadModule = (mod, config) => {
    try {
        console.debug($$`Unloading module "${mod.__descriptor.name}".`);
        if (mod.__running) exports.stopIntegration(mod);
        if (mod.unload) mod.unload();
        config.saveConfig(mod.__descriptor.name);
        mod.platform = null;
        for (let type of mod.__descriptor.type) {
            const index = loaded[type].indexOf(mod);
            loaded[type].splice(index, 1);
        }
        $$.removeContextIfExists(mod.__descriptor.name);
    }
    catch (e) {
        console.error($$`Unloading module "${mod.__descriptor.name}" failed.`);
        console.critical(e);
    }
};

exports.unloadAllModules = (config) => {
    for (let type in loaded) {
        if (!loaded.hasOwnProperty(type)) continue;
        const loadedModules = loaded[type];
        while (loadedModules.length > 0) {
            exports.unloadModule(loadedModules[0], config);
        }
    }
};

exports.stopIntegration = (integration) => {
    if (typeof(integration) === 'string') {
        const filtered = loaded.integration.filter(val => val.__descriptor.name === integration);
        if (filtered.length !== 1) {
            throw new Error('Cannot find integration to stop.');
        }
        integration = filtered[0];
    }

    if (!integration.__running) {
        throw new Error('The specified integration is not running.');
    }

    integration.stop();
    integration.__running = false;
};
