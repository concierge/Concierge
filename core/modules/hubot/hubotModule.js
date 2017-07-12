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

const files = require('concierge/files'),
    path = require('path'),
    reject = 'kassy.json',
    descriptor = 'hubot.json',
    pkg = 'package.json',
    Robot = require('./robot.js');

exports.verifyModule = async(location) => {
    const folderPath = path.resolve(location),
        ndes = path.join(folderPath, `./${reject}`),
        desc = path.join(folderPath, `./${descriptor}`),
        pack = path.join(folderPath, `./${pkg}`);

    if (await files.fileExists(ndes) === 'file') {
        return null;
    }
    let hj;
    if ((await files.fileExists(desc)) === 'file') {
        hj = await files.readJson(desc);
    }
    else {
        let p = {};
        if (await files.fileExists(pack) === 'file') {
            p = await files.readJson(pack);
        }
        if (p.main) {
            hj = Robot.generateHubotJson(folderPath, p.main);
            hj.name = p.name;
            hj.version = p.version;
        }
        else {
            const dirFiles = (await files.readdir(folderPath)).filter(f => f !== '.url');
            if (dirFiles.length !== 1) {
                return null;
            }
            hj = Robot.generateHubotJson(folderPath, dirFiles[0]);
        }
        await files.writeFile(desc, JSON.stringify(hj, null, 4), 'utf8');
    }

    if (!(hj.name && hj.startup && hj.version)) {
        return null;
    }
    hj.folderPath = folderPath;
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
