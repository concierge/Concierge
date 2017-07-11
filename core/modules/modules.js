/**
 * Manages the loading and unloading of modules (regardless of module type).
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2017.
 */

const EventEmitter = require('events'),
    files = require('concierge/files'),
    path = require('path');

class ModuleLoader extends EventEmitter {
    constructor (platform) {
        super();
        this._loaderPaths = ['./kassy/kassyModule.js', './hubot/hubotModule.js'];
        this._loaders = this._loaderPaths.map(require);
        this._loaded = {};
        this.platform = platform;
    }

    _insertSorted (mod) {
        const priority = mod.__descriptor.priority;
        for (let type of mod.__descriptor.type) {
            if (!this._loaded[type]) {
                this._loaded[type] = [mod];
                continue;
            }
            const loadedModules = this._loaded[type];
            let upper = 0,
                lower = loadedModules.length - 1;

            while (lower > upper) {
                const middle = Math.floor((upper + lower) / 2);
                if (priority < loadedModules[middle].__descriptor.priority) {
                    lower = Math.max(middle, 0);
                }
                else if (priority > loadedModules[middle].__descriptor.priority) {
                    upper = Math.min(middle, loadedModules.length - 1);
                }
                break;
            }
            loadedModules.splice(lower, 0, mod);
        }
    }

    /**
     * Check for existing loaded modules of the same name.
     * @param {Object} mod the module descriptor to check for.
     * @returns {boolean} if a module of the same name has been loaded.
     */
    _checkExisting (mod) {
        const filter = val => val.__descriptor.name === mod.name;
        return Array.isArray(mod.type) ?
            mod.type.map(t => this._loaded[t] && this._loaded[t].some(filter)).some(r => r) :
            this._loaded[mod.type] && this._loaded[mod.type].some(filter);
    }

    /**
     * Sleep for 0ms, which has the affect of letting the existing event loop complete
     * any functions it has queued. This should be used before any long-running methods.
     * @returns {Promise} an awaitable promise.
     */
    _sleep (ms = 0) {
        return new Promise(r => setTimeout(r, ms));
    }

    /**
     * Gets all the loaded modules of a particular type.
     * If no type is provided, all modules are retreived.
     * @param {string} type the type of modules to retreive (optional).
     * @returns {Array<object>} either an array of modules or an associative
     * object containing modules and their types
     */
    getLoadedModules (type) {
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
     * Gets a loaded module by name or filter function.
     * @param {string|function()|Object} arg either the name, a filter function to find the module
     * or the module itself (which will just then be returned - useful for argument parsing).
     * @param {string} type the type of module to search for. Defaults to any (null).
     * @return {Object} the module (if found), array-like otherwise except where the module(s) do
     * not exist when void(0) will be returned.
     * @emits Platform#started
     */
    getModule (arg, type = null) {
        const typeName = typeof(arg);
        let func = arg;
        if (typeName === 'object') {
            return arg;
        }
        else if (typeName === 'string') {
            func = mod => mod.__descriptor.name.trim().toLowerCase() === arg.trim().toLowerCase();
        }
        return this.getLoadedModules(type).find(func);
    }

    /**
     * Loads a module based on a provided module descriptor.
     * @param {Object<>} module the module descriptor.
     * @fires ModuleLoader#preload
     * @fires ModuleLoader#load
     * @return {Object} status of the load request.
     */
    async loadModule (descriptor) {
        if (this._checkExisting(descriptor)) {
            return null; // already loaded
        }
        /**
         * Preload event. Fired before a module is loaded.
         * @event ModuleLoader#preload
         * @type {object} module descriptor.
         */
        this.emit('preload', descriptor);
        LOG.info($$`Loading module '${descriptor.name}'`);
        const loadEvent = {
            success: true,
            module: null,
            descriptor: descriptor
        };
        try {
            await require.forcePackageInstall(descriptor.folderPath);
            await $$.createContext(descriptor.folderPath);
            loadEvent.module = await this._loaders[descriptor.__loaderUID].loadModule(descriptor);
            loadEvent.module.__descriptor = descriptor;
            loadEvent.module.platform = this.platform;
            loadEvent.module.config = await this.platform.config.loadConfig(descriptor);
            this._insertSorted(loadEvent.module);
            LOG.info($$`Loading Succeeded`);
        }
        catch (e) {
            loadEvent.success = false;
            LOG.error($$`Loading Failed`);
            LOG.critical(e);
            LOG.debug($$`Module "${descriptor.name}" could not be loaded.`);
        }
        /**
         * Load event. Fired after a module is loaded, but before the module is notified via load().
         * @event ModuleLoader#load
         * @type {object}
         * @property {boolean} success - Indicates wheather loading was successful.
         * @property {object} module - Module instance or descriptor.
         */
        this.emit('load', loadEvent);
        if (loadEvent.success && loadEvent.module.load) {
            await this._sleep();
            await loadEvent.module.load(this.platform);
        }
        return loadEvent;
    }

    /**
     * Loads all modules in the modules directory and starts the configuration service.
     * @param {Array<string>} modules optional list of modules to load.
     */
    async loadAllModules (modules) {
        const data = (modules || (await files.filesInDirectory(global.__modulesPath)).map(d => path.join(global.__modulesPath, d)));
        const mods = (await Promise.all(data.map(async(d) => {
            try {
                const output = await this.verifyModule(path.resolve(d));
                if (!output) {
                    LOG.debug($$`Skipping "${d}". It isn't a module.`);
                }
                return output;
            }
            catch (e) {
                LOG.debug($$`A failure occured while listing "${d}". It doesn't appear to be a module.`);
                LOG.critical(e);
                return null;
            }
        }))).filter(m => !!m);

        const systemMods = mods.filter(m => m.type.includes('system')),
            normalMods = mods.filter(m => !m.type.includes('system'));

        // force system to load first
        await Promise.all(systemMods.map(m => this.loadModule(m)));
        this.emit('loadSystem');

        await Promise.all(normalMods.map(async(m) => {
            try {
                await this.loadModule(m);
            }
            catch (e) {
                LOG.critical(e);
            }
        }));
        this.emit(systemMods.length + normalMods.length > 0 ? 'loadAll' : 'loadNone');
    }

    /**
     * Starts the specified integration. Integration must be loaded first.
     * @param {Object|string|function()} integrationSearchParam instance to start. In addion to the
     * integration itself, this method accepts any of the parameters of the ModuleLoader#getModule method.
     * @fires ModuleLoader#prestart
     * @fires ModuleLoader#start
     * @returns {Object} the status of the load request.
     */
    async startIntegration (integrationSearchParam) {
        const integration = this.getModule(integrationSearchParam);
        if (!integration || !integration.__descriptor.type.includes('integration') || integration.__running) {
            throw new Error(`Integration "${integrationSearchParam.toString()}" ${
                integration && integration.__running ? 'already started' : 'not found'}.`);
        }
        LOG.info($$`Loading integration '${integration.__descriptor.name}'...\t`);
        const startEvent = {
            success: true,
            integration: integration
        };
        /**
         * Prestart event. Fired before an integration is started.
         * @event ModuleLoader#prestart
         * @type {object} - Integration instance.
         */
        this.emit('prestart', integration);
        try {
            await this._sleep(); // ensure we are not blocking any ongoing operations
            await integration.start((api, event) => {
                event.event_source = integration.__descriptor.name;
                this.platform.onMessage(api, event);
            });
            integration.__running = true;
        }
        catch (e) {
            LOG.debug($$`Failed to start output integration '${integration.__descriptor.name}'.`);
            LOG.critical(e);
            startEvent.success = false;
        }
        /**
         * Start event. Fired after an integration has been started.
         * @event ModuleLoader#start
         * @type {object}
         * @property {boolean} success - Indicates wheather starting was successful.
         * @property {object} integration - Integration instance.
         */
        this.emit('start', startEvent);
        return startEvent;
    }

    /**
     * Verifies is a directory is a module.
     * @param {string} directory path to the directory.
     * @returns {object} descriptor required to load directory as a module, or null if not a module.
     */
    async verifyModule (directory) {
        const res = await Promise.all(this._loaders.map(async(l) => {
            if ((await files.fileExists(directory)) !== 'directory') {
                return null;
            }
            const mod = await l.verifyModule(directory);
            if (!mod) {
                return mod;
            }
            // convert version to semver
            const spl = mod.version.toString().split('.');
            mod.version = spl.concat(Array(3 - spl.length).fill('0')).join('.');
            switch (mod.priority) {
            case 'first': mod.priority = Number.MIN_SAFE_INTEGER; break;
            case 'last': mod.priority = Number.MAX_SAFE_INTEGER; break;
            default: mod.priority = 0; break;
            }
            if (!Array.isArray(mod.type)) {
                mod.type = !!mod.type ? [mod.type] : ['module'];
            }
            mod.__loaderUID = this._loaders.indexOf(l);
            return mod;
        }));
        return res.find(d => !!d) || null;
    }

    /**
     * Unloads a module. The module must be loaded first.
     * @param {Object|string|function()} mod module instance to unload. In addion to the module itself,
     * this method accepts any of the parameters of the ModuleLoader#getModule method.
     * @fires ModuleLoader#preunload
     * @fires ModuleLoader#load
     * @returns {Object} an object representing the status of the unload request.
     */
    async unloadModule (mod) {
        mod = this.getModule(mod);
        const descriptor = mod.__descriptor;
        const unloadEvent = {
            success: true,
            module: mod
        };
        /**
         * PreUnload event. Fired before a module is unloaded.
         * @event ModuleLoader#preunload
         * @type {object} - Module instance.
         */
        this.emit('preunload', mod);
        try {
            LOG.info($$`Unloading module "${descriptor.name}".`);
            if (mod.__running) {
                await this.stopIntegration(mod);
            }
            if (mod.unload) {
                await this._sleep(); // ensure we are not blocking any ongoing operations
                await mod.unload(mod.platform);
            }
            await mod.platform.config.saveConfig(descriptor);
            mod.config = null;
            mod.platform = null;
            for (let type of descriptor.type) {
                const index = this._loaded[type].indexOf(mod);
                this._loaded[type].splice(index, 1);
                if (this._loaded[type].length === 0) {
                    delete this._loaded[type];
                }
            }
            $$.removeContext(descriptor.name);
            require.unrequire(descriptor.folderPath || descriptor.startup, this._loaderPaths[descriptor.__loaderUID]);
        }
        catch (e) {
            LOG.error($$`Unloading module "${descriptor.name}" failed.`);
            LOG.critical(e);
            unloadEvent.success = false;
        }
        /**
         * Unload event. Fired after a module is unloaded.
         * @event ModuleLoader#unload
         * @type {object}
         * @property {boolean} success - Indicates wheather unloading was successful.
         * @property {object} module - Module instance.
         */
        this.emit('unload', unloadEvent);
        return unloadEvent;
    }

    /**
     * Unloads all currently loaded modules. Modules of type 'system' will be unloaded last.
     * This will render the program essentially unusable, so should only be used during a shutdown.
     */
    async unloadAllModules () {
        const _unloadAllModulesOfType = async(type) => {
            const loadedModules = this._loaded[type] ? this._loaded[type].slice() : [];
            return await Promise.all(loadedModules.map(mod => this.unloadModule(mod)));
        };
        const unloadTypes = Object.keys(this._loaded).filter(t => t !== 'system').map(t => _unloadAllModulesOfType(t));
        const results = await Promise.all(unloadTypes);
        results.push(await _unloadAllModulesOfType('system')); // force system to be last
        return results;
    }

    /**
     * Stops a currently running integration.
     * @param {Object|string|function()} integration instance to stop. In addion to the integration itself,
     * this method accepts any of the parameters of the ModuleLoader#getModule method.
     * @fires ModuleLoader#prestop
     * @fires ModuleLoader#stop
     * @returns {Object} the status of the stop request.
     */
    async stopIntegration (integration) {
        integration = this.getModule(integration);
        if (!integration.__descriptor.type.includes('integration') || !integration.__running) {
            throw new Error('No such integration exists or the specified integration is not running.');
        }

        /**
         * Prestop event. Fired before an integration is stopped.
         * @event ModuleLoader#prestop
         * @type {object} - Integration instance.
         */
        this.emit('prestop', integration);
        const stopEvent = {
            success: true,
            integration: integration
        };
        try {
            await this._sleep(); // ensure we are not blocking any ongoing operations
            await integration.stop();
            integration.__running = false;
        }
        catch (e) {
            LOG.debug(`Integration "${integration.__descriptor.name}" failed to stop.`);
            LOG.critical(e);
            stopEvent.success = false;
        }
        /**
         * Stop event. Fired after an integration has been stopped.
         * @event ModuleLoader#stop
         * @type {object}
         * @property {boolean} success - Indicates wheather stopping was successful.
         * @property {object} integration - Integration instance.
         */
        this.emit('stop', stopEvent);
        return stopEvent;
    }
}

module.exports = ModuleLoader;
