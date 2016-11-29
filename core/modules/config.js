/**
    * Manages the loading and saving of configuration data.
    *
    * Written By:
    *              Matthew Knox
    *
    * License:
    *              MIT License. All code unless otherwise specified is
    *              Copyright (c) Matthew Knox and Contributors 2015.
    */

const path = require('path'),
    fs = require('fs'),
    configFileName = 'config.json',
    globalScope = '%';

class Configuration {
    constructor() {
        this.configCache = {};
        this.interceptor = null;
    }

    /**
     * Redirects all config method calls to another object.
     * @param {object} interceptor the object to redirect method calls to.
     */
    setInterceptor(interceptor) {
        this.interceptor = interceptor;
    }

    /**
     * loadConfig - loads the configuration of a module.
     *
     * @param  {string} scope Name or path to the configuration file. Leave empty for global config.
     * @param  {string} name  Name of the module. Required if {scope} is a path.
     * @return {Object}       An object representing the configuration.
     */
    loadConfig(scope, name) {
        if (!scope) {
            scope = globalScope;
        }

        if (this.interceptor) {
            return this.interceptor.loadConfig(scope, name);
        }

        if (this.configCache.hasOwnProperty(scope)) {
            return this.configCache[scope].data;
        }

        let configPath;
        if (scope === globalScope) {
            configPath = global.rootPathJoin(configFileName);
        }
        else {
            const p = path.parse(scope);
            if (!!p.dir) {
                configPath = path.join(scope, configFileName);
                if (!name) {
                    throw new Error('No name provided for loaded module.');
                }
                scope = name;
            }
            else {
                configPath = path.join(global.__modulesPath, scope, configFileName);
            }
        }

        let data;
        try {
            const temp = fs.readFileSync(configPath, 'utf8');
            data = JSON.parse(temp);
        }
        catch (e) {
            console.debug($$`No or invalid configuration file found at "${configPath}".`);
            data = {};
        }

        if (this.configCache.hasOwnProperty(scope)) {
            for (let key of Object.keys(this.configCache[scope].data)) {
                data[key] = this.configCache[scope].data[key];
            }
        }

        for (let key of Object.keys(data)) {
            if (key.startsWith('ENV_') && key === key.toUpperCase()) {
                process.env[key.substr(4)] = data[key];
            }
        }
        this.configCache[scope] = {
            name: scope,
            location: configPath,
            data: data
        };

        return data;
    }

    /**
     * getSystemConfig - Convenience method for safely getting system configuration sections.
     *
     * @param  {string} section Section of the configuration file to retrieve.
     * @return {Object}         The section, or empty object if undefined.
     */
    getSystemConfig(section) {
        if (this.interceptor) {
            return this.interceptor.getSystemConfig(section);
        }

        const config = this.loadConfig();
        if (config[section] === void(0)) {
            config[section] = {};
        }
        return config[section];
    }

    /**
     * saveConfig - Save the configuration of a module.
     *
     * @param  {string} scope The name of the module to save.
     * @return {undefined}    Returns nothing.
     */
    saveConfig(scope) {
        if (!scope) {
            scope = globalScope;
        }

        if (this.interceptor) {
            this.interceptor.saveConfig(scope);
            return;
        }

        if (!this.configCache.hasOwnProperty(scope)) {
            throw new Error('No such config to save.');
        }
        try {
            const config = this.configCache[scope],
            data = JSON.stringify(config.data, (key, value) => {
                // deliberate use of undefined, will cause property to be deleted.
                return value === null || typeof value === 'object' && Object.keys(value).length === 0 ? void (0) : value;
            }, 4);
            if (!!data) { // there is data to write
                fs.writeFileSync(config.location, data, 'utf8');
            }
            delete this.configCache[scope];
        }
        catch (e) {
            console.critical(e);
        }
    }

    /**
     * getActiveScopes - Gets an array of all the active scope names.
     *
     * @returns {Array<string>} all the active scope names
     */
    getActiveScopes() {
        return Object.keys(this.configCache);
    }
}

class ConfigurationService {
    constructor() {
        this.configuration = new Configuration();
    }

    loadHook(obj) {
        if (!obj.success) {
            return;
        }
        const mod = obj.module;
        mod.config = module.exports.configuration.loadConfig(mod.__descriptor.folderPath, mod.__descriptor.name);
        if (mod.__descriptor.type.includes('integration')) {
            if (!mod.config.commandPrefix) {
                mod.config.commandPrefix = module.exports.platform.defaultPrefix;
            }
            const sysConfig = module.exports.configuration.getSystemConfig('output');
            if (sysConfig.hasOwnProperty(mod.__descriptor.name)) {
                process.emitWarning(`Integration '${mod.__descriptor.name}' has configuration in the global configuration file; this should be moved as the behaviour is deprecated.` +
                    ' Any global configuration will overwrite local configuration, but only local configuration is saved.');
                for (let key in sysConfig[mod.__descriptor.name]) {
                    if (sysConfig[mod.__descriptor.name].hasOwnProperty(key)) {
                        mod.config[key] = sysConfig[mod.__descriptor.name][key];
                    }
                }
            }
        }
    }

    unloadHook(obj) {
        if (!obj.success) {
            return;
        }
        module.exports.configuration.saveConfig(obj.module.__descriptor.name);
        obj.module.config = null;
    }

    load() {
        this.platform.modulesLoader.on('load', this.loadHook);
        this.platform.modulesLoader.on('unload', this.unloadHook);
    }

    unload() {
        this.platform.modulesLoader.removeListener('load', this.loadHook);
        this.platform.modulesLoader.removeListener('unload', this.unloadHook);
        for (let conf of this.configuration.getActiveScopes()) {
            this.configuration.saveConfig(conf);
        }
    }
}

module.exports = new ConfigurationService();
