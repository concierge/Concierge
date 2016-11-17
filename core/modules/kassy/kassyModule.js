/**
 * Provides helper functions for handling user and system modules.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2016.
 */

const fs              = require('fs'),
    path            = require('path'),
    descriptor      = 'kassy.json';

const moduleTypeFunctions = {
    'module': ['run', 'match'],
    'service': ['load', 'unload'],
    'integration': ['start', 'stop', 'getApi']
};

exports.verifyModule = (location) => {
    let stat = fs.statSync(location);
    if (!stat.isDirectory()) {
        return null;
    }

    const folderPath = path.resolve(location),
        p = path.join(folderPath, `./${descriptor}`);
    try {
        stat = fs.statSync(p);
        if (!stat) {
            return null;
        }
    }
    catch (e) {
        return null;
    }

    const kj = require.once(p);
    if (!(kj.name && kj.startup && kj.version)) {
        return null;
    }

    if (!kj.folderPath) {
        kj.folderPath = folderPath;
    }

    if (!kj.type) {
        kj.type = 'module';
    }

    return kj;
};

exports.loadModule = (module) => {
    const modulePath = module.folderPath;
    let startPath   = module.startup,
        m;

    try {
        if (modulePath) {
            startPath = path.join(modulePath, startPath);
        }

        m = require.once(startPath);

        if (!m.match && module.command) {
            m.match = (event, commandPrefix) => {
                return event.arguments[0] === commandPrefix + module.command;
            };
        }

        const types = [];
        for (let type in moduleTypeFunctions) {
            if (!moduleTypeFunctions.hasOwnProperty(type)) {
                continue;
            }

            if (!moduleTypeFunctions[type].some(func => !m[func])) {
                types.push(type);
            }
        }

        if (module.type) {
            if (typeof(module.type) === 'string') {
                module.type = [module.type];
            }

            if (!module.type.every(t => types.includes(t))) {
                throw new Error($$`Module is not one of the defined module types.`);
            }
        }
        module.type = types;
    }
    catch (e) {
        console.critical(e);
        throw new Error($$`Could not load module '${module.name}'. Does it have a syntax error?`);
    }
    return m;
};
