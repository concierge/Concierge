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

const files = require('concierge/files'),
    path = require('path'),
    descriptor = 'kassy.json';

const moduleTypeFunctions = {
    'module': ['run', 'match'],
    'service': ['load', 'unload'],
    'integration': ['start', 'stop', 'getApi']
};

exports.verifyModule = async(location) => {
    const folderPath = path.resolve(location),
        p = path.join(folderPath, `./${descriptor}`);

    if ((await files.fileExists(p)) !== 'file') {
        return null;
    }

    const kj = await files.readJson(p);
    if (!(kj.name && kj.startup && kj.version !== void(0) && kj.version != null)) {
        return null;
    }

    kj.folderPath = folderPath;

    if (!kj.type) {
        kj.type = 'module';
    }
    return kj;
};

exports.loadModule = module => {
    const modulePath = module.folderPath;
    let startPath   = module.startup,
        m;

    try {
        if (modulePath) {
            startPath = path.join(modulePath, startPath);
        }

        m = require(startPath);

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

            if (!module.type.every(t => types.includes(t) || t === 'system')) {
                throw new Error($$`Module is not one of the defined module types.`);
            }
        }
        else {
            module.type = types;
        }
    }
    catch (e) {
        console.critical(e);
        throw new Error($$`Could not load module '${module.name}'. Does it have a syntax error?`);
    }
    return m;
};
