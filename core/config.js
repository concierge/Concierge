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

let path = require('path'),
    fs = require('fs'),
    configFileName = 'config.json',
    globalScope = '%';

class ConfigService {
    constructor() {
        this.configCache = {};
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

        if (this.configCache.hasOwnProperty(scope)) {
            return this.configCache[scope].data;
        }

        let configPath;
        if (scope === globalScope) {
            configPath = global.rootPathJoin(configFileName);
        }
        else {
            let p = path.parse(scope);
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
            let temp = fs.readFileSync(configPath, 'utf8');
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
        let config = this.loadConfig();
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

        if (!this.configCache.hasOwnProperty(scope)) {
            throw new Error('No such config to save.');
        }
        let config = this.configCache[scope],
            data = JSON.stringify(config.data, (key, value) => {
                // deliberate use of undefined, will cause property to be deleted.
                return value === null || typeof value === 'object' && Object.keys(value).length === 0 ? void (0) : value;
            }, 4);
        try {
            if (!!data) { // there is data to write
                fs.writeFileSync(config.location, data, 'utf8');
            }
            delete this.configCache[scope];
        } catch (e) {}
    }
};

module.exports = ConfigService;
