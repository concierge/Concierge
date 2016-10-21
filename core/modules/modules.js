/**
 * Manages the loading and unloading of modules (regardless of module type).
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2016.
 */

const EventEmitter = require('events'),
    files = require.once(rootPathJoin('core/files.js')),
    path = require('path');

class ModuleLoader extends EventEmitter {
    constructor() {
        super();
        this._loaders = [require.once('./kassy/kassyModule.js'), require.once('./hubot/hubotModule.js')];
        this._loaded = {};
    }

    _loadModuleInternal(module, platform) {
        try {
            console.write($$`Loading module '${module.name}'... ${(console.isDebug() ? '\n' : '\t')}`);
            const m = this._loaders[module.__loaderUID].loadModule(module, platform.config);
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
    }

    _insertSorted(module) {
        for (let type of module.__descriptor.type) {
            if (!this._loaded[type]) {
                this._loaded[type] = [];
            }
            const loadedModules = this._loaded[type];
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
    }

    /**
     * Gets all the loaded modules of a particular type.
     * If no type is provided, all modules are retreived.
     * @param {string} type the type of modules to retreive (optional).
     * @returns {Array<>|Object<>} either an array of modules or an associative
     * object containing modules and their types/
     */
    getLoadedModules(type) {
        return !type ? this._loaded : this._loaded[type] || [];
    }

    /**
     * Loads a module based on a provided module descriptor.
     * @param {Object<>} module the module descriptor.
     * @param {Object<>} platform a reference to the loaded platform.
     * @fires ModuleLoader#preload
     * @fires ModuleLoader#load
     */
    loadModule(module, platform) {
        /**
         * Preload event. Fired before a module is loaded.
         * @event ModuleLoader#preload
         * @type {object} module descriptor.
         */
        this.emit('preload', module);
        const ld = this._loadModuleInternal(module, platform);
        if (!ld) {
            this.emit('load', {
                success: false,
                module: module
            });
            return;
        }
        this._insertSorted(ld);
        if (module.type.includes('integration') && !module.config.commandPrefix) {
            module.config.commandPrefix = platform.defaultPrefix;
        }
        /**
         * Load event. Fired after a module is loaded, but before the module is notified via load().
         * @event ModuleLoader#load
         * @type {object}
         * @property {boolean} success - Indicates wheather loading was successful.
         * @property {object} module - Module instance or descriptor.
         */
        this.emit('load', {
            success: true,
            module: ld
        });
        if (ld.load) {
            ld.load.call(ld.platform);
        }
    }

    /**
     * Loads all modules in the modules directory.
     * @param {object} platform a reference to the core platform.
     */
    loadAllModules(platform) {
        const data = files.filesInDirectory(global.__modulesPath);
        for (let i = 0; i < data.length; i++) {
            try {
                const candidate = path.resolve(path.join(global.__modulesPath, data[i])),
                    output = this.verifyModule(candidate);
                if (output) {
                    this.loadModule(output, platform);
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
    }

    /**
     * Starts the specified integration. Integration must be loaded first.
     * @param {function()} callback the message callback to be called by integrations.
     * @param {object|string} integration integration instance or name.
     * @fires ModuleLoader#prestart
     * @fires ModuleLoader#start
     */
    startIntegration(callback, integration) {
        if (typeof (integration) === 'string') {
            const filtered = this._loaded.integration.filter(val => val.__descriptor.name === integration);
            if (filtered.length !== 1) {
                throw new Error('Cannot find integration to start');
            }
            integration = filtered[0];
        }

        if (integration.__running) {
            throw new Error('The specified integration is already running.');
        }

        /**
         * Prestart event. Fired before an integration is started.
         * @event ModuleLoader#prestart
         * @type {object} - Integration instance.
         */
        this.emit('prestart', integration);
        let success = true;
        try {
            integration.__running = true;
            integration.start((api, event) => {
                event.event_source = integration.__descriptor.name;
                callback(api, event);
            });
        }
        catch (e) {
            success = false;
        }

        /**
         * Start event. Fired after an integration has been started.
         * @event ModuleLoader#start
         * @type {object}
         * @property {boolean} success - Indicates wheather starting was successful.
         * @property {object} integration - Integration instance.
         */
        this.emit('start', {
            success: success,
            integration: integration
        });
    }

    /**
     * Verifies is a directory is a module.
     * @param {string} directory path to the directory.
     * @returns {object} descriptor required to load directory as a module, or null if not a module.
     */
    verifyModule(directory) {
        for (let i = 0; i < this._loaders.length; i++) {
            const mod = this._loaders[i].verifyModule(directory);
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
    }

    /**
     * Unloads a module. The module must be loaded first.
     * @param {object} mod module instance to unload.
     * @param {object} config reference to the configuration service.
     * @fires ModuleLoader#preunload
     * @fires ModuleLoader#load
     */
    unloadModule(mod, config) {
        let success = true;
        /**
         * PreUnload event. Fired before a module is unloaded.
         * @event ModuleLoader#preunload
         * @type {object} - Module instance.
         */
        this.emit('preunload', mod);
        try {
            console.debug($$`Unloading module "${mod.__descriptor.name}".`);
            if (mod.__running) {
                this.stopIntegration(mod);
            }
            if (mod.unload) {
                mod.unload();
            }
            config.saveConfig(mod.__descriptor.name);
            mod.platform = null;
            for (let type of mod.__descriptor.type) {
                const index = this._loaded[type].indexOf(mod);
                this._loaded[type].splice(index, 1);
            }
            $$.removeContextIfExists(mod.__descriptor.name);
        }
        catch (e) {
            console.error($$`Unloading module "${mod.__descriptor.name}" failed.`);
            console.critical(e);
            success = false;
        }
        /**
         * Unload event. Fired after a module is unloaded.
         * @event ModuleLoader#unload
         * @type {object}
         * @property {boolean} success - Indicates wheather unloading was successful.
         * @property {object} module - Module instance.
         */
        this.emit('unload', {
            success: success,
            module: mod
        });
    }

    /**
     * Unloads all currently loaded modules.
     * @param {object} config a reference to the configuration service.
     */
    unloadAllModules(config) {
        for (let type in this._loaded) {
            if (!this._loaded.hasOwnProperty(type)) {
                continue;
            }
            const loadedModules = this._loaded[type];
            while (loadedModules.length > 0) {
                this.unloadModule(loadedModules[0], config);
            }
        }
    }

    /**
     * Stops a currently running integration.
     * @param {object|string} integration integration instance or name.
     * @fires ModuleLoader#prestop
     * @fires ModuleLoader#stop
     */
    stopIntegration(integration) {
        if (typeof(integration) === 'string') {
            const filtered = this._loaded.integration.filter(val => val.__descriptor.name === integration);
            if (filtered.length !== 1) {
                throw new Error('Cannot find integration to stop.');
            }
            integration = filtered[0];
        }

        if (!integration.__running) {
            throw new Error('The specified integration is not running.');
        }

        /**
         * Prestop event. Fired before an integration is stopped.
         * @event ModuleLoader#prestop
         * @type {object} - Integration instance.
         */
        this.emit('prestop', integration);
        let success = true;
        try {
            integration.stop();
            integration.__running = false;
        }
        catch (e) {
            success = false;
        }

        /**
         * Stop event. Fired after an integration has been stopped.
         * @event ModuleLoader#stop
         * @type {object}
         * @property {boolean} success - Indicates wheather stopping was successful.
         * @property {object} integration - Integration instance.
         */
        this.emit('stop', {
            success: success,
            integration: integration
        });
    }
}

module.exports = new ModuleLoader();
