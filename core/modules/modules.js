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
    files = require('concierge/files'),
    path = require('path');

class ModuleLoader extends EventEmitter {
    constructor(platform) {
        super();
        this._loaderPaths = ['./kassy/kassyModule.js', './hubot/hubotModule.js'];
        this._loaders = [];
        for (let loader of this._loaderPaths) { // paths needed later
            this._loaders.push(require(loader));
        }
        this._loaded = {};
        this.platform = platform;
    }

    _loadModuleInternal(module) {
        try {
            console.info($$`Loading module '${module.name}'... ${' '}`);
            const m = this._loaders[module.__loaderUID].loadModule(module);
            m.__descriptor = module;
            m.platform = this.platform;
            console.info($$`Loading Succeeded`);
            return m;
        }
        catch (e) {
            console.error($$`Loading Failed`);
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
     * @returns {Array<object>} either an array of modules or an associative
     * object containing modules and their types
     */
    getLoadedModules(type) {
        if (type) {
            return this._loaded[type];
        }
        let loaded = [];
        for (let t in this._loaded) {
            if (this._loaded.hasOwnProperty(t)) {
                loaded = loaded.concat(this._loaded[t]);
            }
        }
        return Array.from(new Set(loaded)); // remove duplicates
    }

    /**
     * Check for existing loaded modules of the same name.
     * @param {Object<>} module the module descriptor to check for.
     * @returns {boolean} if a module of the same name and version have been loaded.
     */
    _checkExisting(module) {
        for (let type of Object.keys(this._loaded)) {
            if (!this._loaded.hasOwnProperty(type)) {
                continue;
            }
            const filtered = this._loaded[type].filter(val => val.__descriptor.name === module.name &&
                val.__descriptor.version === module.version);
            if (filtered.length > 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Loads a module based on a provided module descriptor.
     * @param {Object<>} module the module descriptor.
     * @fires ModuleLoader#preload
     * @fires ModuleLoader#load
     * @return {Object} status of the load request.
     */
    loadModule(module) {
        /**
         * Preload event. Fired before a module is loaded.
         * @event ModuleLoader#preload
         * @type {object} module descriptor.
         */
        this.emit('preload', module);

        if (this._checkExisting(module)) {
            return null; // already loaded
        }

        const ld = this._loadModuleInternal(module);
        if (!ld) {
            const loadObj = {
                success: false,
                module: module
            };
            this.emit('load', loadObj);
            return loadObj;
        }
        this._insertSorted(ld);
        ld.config = ld.platform.config.loadConfig(ld.__descriptor);
        const loadObj = {
            success: true,
            module: ld
        };
        /**
         * Load event. Fired after a module is loaded, but before the module is notified via load().
         * @event ModuleLoader#load
         * @type {object}
         * @property {boolean} success - Indicates wheather loading was successful.
         * @property {object} module - Module instance or descriptor.
         */
        this.emit('load', loadObj);
        if (ld.load) {
            ld.load(ld.platform);
        }
        return loadObj;
    }

    /**
     * Loads all modules in the modules directory and starts the configuration service.
     */
    loadAllModules() {
        const data = files.filesInDirectory(global.__modulesPath),
            resolvedModules = [],
            resolvedSystem = [];
        for (let i = 0; i < data.length; i++) {
            try {
                const candidate = path.resolve(path.join(global.__modulesPath, data[i])),
                    output = this.verifyModule(candidate);
                if (output) {
                    (output.type.includes('system') ? resolvedSystem : resolvedModules).push(output);
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
        for (let output of resolvedSystem) {
            this.loadModule(output); // force system to be first
        }
        this.emit('loadSystem');
        for (let output of resolvedModules) {
            this.loadModule(output);
        }
    }

    /**
     * Starts the specified integration. Integration must be loaded first.
     * @param {function()} callback the message callback to be called by integrations.
     * @param {object|string} integration integration instance or name.
     * @fires ModuleLoader#prestart
     * @fires ModuleLoader#start
     * @returns {Object} the status of the load request.
     */
    startIntegration(callback, integration) {
        if (typeof (integration) === 'string') {
            const filtered = (this._loaded.integration || []).filter(val => val.__descriptor.name === integration);
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
            integration.start((api, event) => {
                event.event_source = integration.__descriptor.name;
                callback(api, event);
            });
            integration.__running = true;
        }
        catch (e) {
            console.debug(`Integration "${integration.__descriptor.name}" failed to start.`);
            console.critical(e);
            success = false;
        }
        const startObj = {
            success: success,
            integration: integration
        };
        /**
         * Start event. Fired after an integration has been started.
         * @event ModuleLoader#start
         * @type {object}
         * @property {boolean} success - Indicates wheather starting was successful.
         * @property {object} integration - Integration instance.
         */
        this.emit('start', startObj);
        return startObj;
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
     * @fires ModuleLoader#preunload
     * @fires ModuleLoader#load
     * @returns {Object} an object representing the status of the unload request.
     */
    unloadModule(mod) {
        let success = true;
        /**
         * PreUnload event. Fired before a module is unloaded.
         * @event ModuleLoader#preunload
         * @type {object} - Module instance.
         */
        this.emit('preunload', mod);
        try {
            console.info($$`Unloading module "${mod.__descriptor.name}".`);
            if (mod.__running) {
                this.stopIntegration(mod);
            }
            if (mod.unload) {
                mod.unload();
            }
            mod.platform.config.saveConfig(mod.__descriptor);
            mod.config = null;
            mod.platform = null;
            for (let type of mod.__descriptor.type) {
                const index = this._loaded[type].indexOf(mod);
                this._loaded[type].splice(index, 1);
            }
            $$.removeContextIfExists(mod.__descriptor.name);
            require.unrequire(mod.__descriptor.folderPath || mod.__descriptor.startup, this._loaderPaths[mod.__descriptor.__loaderUID]);
        }
        catch (e) {
            console.error($$`Unloading module "${mod.__descriptor.name}" failed.`);
            console.critical(e);
            success = false;
        }
        const unloadObj = {
            success: success,
            module: mod
        };
        /**
         * Unload event. Fired after a module is unloaded.
         * @event ModuleLoader#unload
         * @type {object}
         * @property {boolean} success - Indicates wheather unloading was successful.
         * @property {object} module - Module instance.
         */
        this.emit('unload', unloadObj);
        return unloadObj;
    }

    /**
     * Unloads all currently loaded modules.
     */
    unloadAllModules() {
        const unloadType = type => {
            const loadedModules = this._loaded[type] ? this._loaded[type].slice() : [];
            for (let mod of loadedModules) {
                this.unloadModule(mod);
            }
        };
        for (let type in this._loaded) {
            if (!this._loaded.hasOwnProperty(type) || type === 'system') {
                continue;
            }
            unloadType(type);
        }
        unloadType('system'); // force system to be last
    }

    /**
     * Stops a currently running integration.
     * @param {object|string} integration integration instance or name.
     * @fires ModuleLoader#prestop
     * @fires ModuleLoader#stop
     * @returns {Object} the status of the stop request.
     */
    stopIntegration(integration) {
        if (typeof(integration) === 'string') {
            const filtered = (this._loaded.integration || []).filter(val => val.__descriptor.name === integration);
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
            console.debug(`Integration "${integration.__descriptor.name}" failed to stop.`);
            console.critical(e);
            success = false;
        }
        const stopObj = {
            success: success,
            integration: integration
        };
        /**
         * Stop event. Fired after an integration has been stopped.
         * @event ModuleLoader#stop
         * @type {object}
         * @property {boolean} success - Indicates wheather stopping was successful.
         * @property {object} integration - Integration instance.
         */
        this.emit('stop', stopObj);
        return stopObj;
    }
}

module.exports = ModuleLoader;
