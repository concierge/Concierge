/**
 * Manages the loading and saving of configuration data.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

var fs              = require('fs'),
    path            = require('path'),
    modConfig       = null,
    modConfigFile   = 'config.json',
    sysConfig       = null,
    sysConfigZones  = ['output', 'disabled'],
    sysConfigFile   = 'config.json';

var loadConfig = function (location) {
    try {
        var data = fs.readFileSync(location, 'utf8');
        return JSON.parse(data);
    }
    catch (e) {
        console.debug('No or invalid configuration file found at \"' + location + "'.");
        return {};
    }
};

var saveIndividualConfig = function (location, data) {
    fs.writeFileSync(location, JSON.stringify(data, null, 4), 'utf8');
};

exports.saveConfig = function () {
    try {
        saveIndividualConfig(sysConfigFile, sysConfig);
        for (var mod in modConfig) {
            var m = modConfig[mod];
            saveIndividualConfig(m.location, m.data);
        }
        modConfig = null;
        sysConfig = null;
        return true;
    } catch (e) {
        console.error('An error occured while saving the configuration files.');
        console.critical(e);
        return false;
    }
};

exports.getConfig = function (m) {
    var isSystem = sysConfigZones.indexOf(m) >= 0;
    
    if (!sysConfig) {
        sysConfig = loadConfig(sysConfigFile);
    }
    
    if (!isSystem && !sysConfig[m]) {
        return {};
    } else {
        sysConfig[m] = {};
    }
    
    if (!isSystem) {
        console.warn("Configuration data for module '" + m + "' stored in deprecated location. " +
            "Please move configuration to module specific configuration file.");
    }
    return sysConfig[m];
};

exports.loadModuleConfig = function (module, location, ignoreCache) {
    if (!modConfig) {
        modConfig = {};
    }
    
    if (modConfig[module.name] && !ignoreCache) {
        return modConfig[module.name];
    }

    var loc = path.join(location, modConfigFile),
        configData = loadConfig(loc),
        deprecatedData = exports.getConfig(module.name);
    for (var name in deprecatedData) {
        configData[name] = deprecatedData[name];
    }
    
    return configData;
};

exports.loadOutputConfig = function () {
    return exports.getConfig(sysConfigZones[0]);
};

exports.loadDisabledConfig = function () {
    return exports.getConfig(sysConfigZones[1]);
};