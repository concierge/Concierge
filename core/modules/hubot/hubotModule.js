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

const fs = require('fs'),
    path = require('path'),
    descriptor = 'hubot.json',
    pkg = 'package.json',
    Robot = require('./robot.js');

exports.verifyModule = (location) => {
    const stat = fs.statSync(location);
    if (!stat.isDirectory()) {
        return null;
    }

    const folderPath = path.resolve(location),
        desc = path.join(folderPath, `./${descriptor}`),
        pack = path.join(folderPath, `./${pkg}`);
    let hj;

    try {
        fs.statSync(desc);
        hj = require(desc);
    }
    catch (e) {
        try {
            fs.statSync(pack);
            const p = require(pack);
            hj = Robot.generateHubotJson(folderPath, p.main);
            hj.name = p.name;
            hj.version = p.version;
        }
        catch (e) {
            const dirFiles = fs.readdirSync(folderPath).filter(f => f !== '.url');
            if (dirFiles.length !== 1) {
                return null;
            }
            hj = Robot.generateHubotJson(folderPath, dirFiles[0]);
        }

        fs.writeFileSync(desc, JSON.stringify(hj, null, 4), 'utf8');
    }

    if (!(hj.name && hj.startup && hj.version)) {
        return null;
    }
    if (!hj.folderPath) {
        hj.folderPath = folderPath;
    }
    if (!hj.type) {
        hj.type = ['module'];
    }
    return hj;
};

exports.loadModule = (module) => {
    try {
        const modulePath = module.folderPath,
            startPath = path.join(modulePath, module.startup),
            m = require(startPath);
        return new Robot(m, module);
    }
    catch (e) {
        console.critical(e);
        throw new Error($$`Could not load module '${module.name}'. Does it have a syntax error?`);
    }
};
