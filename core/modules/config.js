/**
* Manages the loading and saving of configuration data.
*
* Written By:
*              Matthew Knox
*
* License:
*              MIT License. All code unless otherwise specified is
*              Copyright (c) Matthew Knox and Contributors 2017.
*/

const EventEmitter = require('events'),
    files = require('concierge/files');

const globalScope = {
    name: '%',
    type: ['system']
};

class Configuration extends EventEmitter {
    constructor() {
        super();
        this.configCache = {};
        this.interceptor = null;
        this.interceptorCount = 0;
    }

    /**
     * Redirects all config method calls to another object.
     * @param {object} interceptor the object to redirect method calls to.
     */
    setInterceptor(interceptor) {
        this.interceptor = interceptor;
        this.interceptorCount++;
        this.emit('interceptorSet', interceptor);
    }

    /**
     * getGlobalIndicator - gets the global scope indicator used to direct the
     * configuration to retreive the global config file.
     *
     * @returns {Object} an object used for the global indicator.
     */
    getGlobalIndicator() {
        return globalScope;
    }

    /**
     * loadConfig - loads the configuration of a module.
     *
     * @param  {Object} descriptor Descriptor of the config to load. Leave empty
     * for global config. Must contain name and type properties. Optionally can
     * contain a force property to force the next call to load to merge configs.
     * @return {Object} An object representing the configuration.
     */
    async loadConfig(descriptor) {
        this.emit('preLoad', descriptor);
        if (!descriptor) {
            descriptor = globalScope;
        }

        if (this.configCache.hasOwnProperty(descriptor.name)) {
            if (this.configCache[descriptor.name].ic === this.interceptorCount &&
                !this.configCache[descriptor.name].force) {
                this.emit('load', this.configCache[descriptor.name]);
                return this.configCache[descriptor.name].data;
            }
            this.configCache[descriptor.name].force = false;
        }

        let data;
        if (this.interceptor || descriptor !== globalScope) {
            data = this.interceptor ? (await this.interceptor.loadConfig(descriptor)) : {};
        }
        else {
            try {
                data = await files.readJson(global.rootPathJoin('config.json'));
            }
            catch (e) {
                data = {};
            }
        }

        if (this.configCache.hasOwnProperty(descriptor.name)) {
            for (let key of Object.keys(this.configCache[descriptor.name].data)) {
                data[key] = this.configCache[descriptor.name].data[key];
            }
        }

        if (descriptor.type.includes('integration')) {
            if (!data.commandPrefix) {
                data.commandPrefix = global.currentPlatform.defaultPrefix;
            }
            const sysConfig = this.getSystemConfig('output');
            if (sysConfig.hasOwnProperty(descriptor.name)) {
                process.emitWarning(`Integration '${descriptor.name}' has configuration in the global configuration file; this should be moved as the behaviour is deprecated.` +
                    ' Any global configuration will overwrite local configuration, but only local configuration is saved.');
                for (let key in sysConfig[descriptor.name]) {
                    if (sysConfig[descriptor.name].hasOwnProperty(key)) {
                        data[key] = sysConfig[descriptor.name][key];
                    }
                }
            }
        }

        for (let key of Object.keys(data)) {
            if (key.startsWith('ENV_') && key === key.toUpperCase()) {
                process.env[key.substr(4)] = data[key];
            }
        }

        this.configCache[descriptor.name] = {
            name: descriptor.name,
            data: data,
            ic: this.interceptorCount,
            force: !!descriptor.force
        };

        this.emit('load', this.configCache[descriptor.name]);
        return data;
    }

    /**
     * getSystemConfig - Convenience method for safely getting system
     * configuration sections.
     *
     * @param  {string} section Section of the configuration file to retrieve.
     * @return {Object}         The section, or empty object if undefined.
     */
    async getSystemConfig(section) {
        const config = await this.loadConfig();
        if (config[section] === void(0)) {
            config[section] = {};
        }
        return config[section];
    }

    /**
     * saveConfig - Save the configuration of a module. After this method is
     * called, all cached configuration references should be immediately
     * deleted.
     *
     * An interceptor for this method will be passed one additional parameter -
     * the configuration to save.
     * @param  {Object} descriptor The descriptor of the module to save
     * (or nothing for global configuration).
     * @return {undefined}    Returns nothing.
     */
    async saveConfig(descriptor) {
        if (!descriptor) {
            descriptor = globalScope;
        }

        if (!this.configCache.hasOwnProperty(descriptor.name)) {
            throw new Error('No such config to save.');
        }

        try {
            if (this.interceptor) {
                await this.interceptor.saveConfig(descriptor, this.configCache[descriptor.name].data);
            }
            delete this.configCache[descriptor.name];
        }
        catch (e) {
            console.critical(e);
        }
    }
}

module.exports = Configuration;
