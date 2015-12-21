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

var fs = require('fs'),
    path = require('path'),
    modes = require('./modes.js').listModes(),
    modConfig = null,
    modConfigFile = 'config.json',
    sysConfig = null,
    sysConfigZones = ['output', 'disabled'],
    sysConfigFile = 'config.json';

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

exports.saveModuleConfig = function(mod) {
    try {
        var m = modConfig[mod];
        saveIndividualConfig(m.location, m.data);
        delete modConfig[mod];
        return true;
    } catch (e) {
        console.error('An error occured while saving the configuration file.');
        console.critical(e);
        return false;
    }
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
    var isSystem = sysConfigZones.includes(m);
    
    if (!sysConfig) {
        sysConfig = loadConfig(sysConfigFile);
    }
    
    if (!isSystem && !sysConfig[m]) {
        return {};
    }
    else if (!sysConfig[m]) {
        sysConfig[m] = {};
    }
    
    if (!isSystem) {
        console.warn("\nConfiguration data for module '" + m + "' stored in deprecated location.\n" +
            "Configuration will be moved to module specific configuration file.");
        var cfg = sysConfig[m];
        delete sysConfig[m];
        return cfg;
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
        deprecatedDataA = exports.getConfig(module.name),
        deprecatedDataB = exports.getConfig(module.name + '.js');
    for (var name in deprecatedDataA) {
        configData[name] = deprecatedDataA[name];
    }
    for (var name in deprecatedDataB) {
        configData[name] = deprecatedDataB[name];
    }
    
    modConfig[module.name] = {
        location: path.join(location, modConfigFile),
        data: configData
    };
    return configData;
};

exports.loadOutputConfig = function (outputName) {
    var config = exports.getConfig(sysConfigZones[0]);
    if (!config[outputName]) {
        config[outputName] = {};
    }
	
    for (var obj in config) {
        if (modes.includes(obj)) continue;
        if (!config[outputName][obj]) {
            config[outputName][obj] = config[obj];
        }
    }
    return config[outputName];
};

exports.loadDisabledConfig = function () {
    return exports.getConfig(sysConfigZones[1]);
};