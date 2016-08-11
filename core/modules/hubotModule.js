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

var fs = require('fs'),
    path = require('path'),
    files = require.once('./../files.js'),
    descriptor = 'hubot.json',
    pkg = 'package.json',
    Robot = require.once('./hubot/robot.js');

var verifyModuleDescriptior = function (hj, disabled) {
    if (!hj.name || !hj.startup || !hj.version) {
        return false;
    }

    if (disabled === true && exports.disabledConfig &&
        exports.disabledConfig[hj.name] && exports.disabledConfig[hj.name] === true) {
        return false;
    }
    return true;
};

exports.verifyModule = function (location, disabled) {
    var stat = fs.statSync(location);
    if (!stat.isDirectory()) {
        return null;
    }

    var folderPath = path.resolve(location),
        desc = path.join(folderPath, './' + descriptor),
        pack = path.join(folderPath, './' + pkg),
        hj;

    try {
        fs.statSync(desc);
        hj = require.once(desc);
    }
    catch (e) {
        try {
            fs.statSync(pack);
            var p = require(pack);
            hj = Robot.generateHubotJson(folderPath, p.main);
            hj.name = p.name;
            hj.version = p.version;
        }
        catch (e) {
            var files = fs.readdirSync(folderPath);
            if (files.length !== 1) {
                return null;
            }
            hj = Robot.generateHubotJson(folderPath, files[0]);
        }

        fs.writeFileSync(desc, JSON.stringify(hj, null, 4), 'utf8');
    }

    if (!verifyModuleDescriptior(hj, disabled)) {
        return null;
    }

    if (!hj.folderPath) {
        hj.folderPath = folderPath;
    }
    return hj;
};

exports.listModules = function (disabled) {
    var data = files.filesInDirectory(global.__modulesPath),
        modules = {};

    for (var i = 0; i < data.length; i++) {
        try {
            var candidate = path.resolve(path.join(global.__modulesPath, data[i])),
                output = exports.verifyModule(candidate, disabled);
            if (output) {
                modules[output.name] = output;
            }
            else {
                console.debug($$`Skipping "${data[i]}". It isn't a Hubot module.`);
            }
        } catch (e) {
            console.debug($$`A failure occured while listing "${data[i]}". It doesn't appear to be a module.`);
            console.critical(e);
            continue;
        }
    }
    return modules;
};

exports.loadModule = function (module, config) {
    try {
        var modulePath = module.folderPath,
            startPath = path.join(modulePath, module.startup),
            m = require.once(startPath);

        var cfg = config.loadModuleConfig(module, modulePath);
        return new Robot(m, module, cfg);
    }
    catch (e) {
        console.critical(e);
        throw new Error($$`Could not load module '${module.name}'. Does it have a syntax error?`);
    }
};
