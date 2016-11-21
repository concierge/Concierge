/**
 * Script to extend require, allowing us to reload javascript code
 * without doing a hard reset on the application.
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2016.
 */

'use strict';

const inst = require('./install.js');
let runOnce = false;

const fs = require('fs'),
    path = require('path'),
    common = {};

// populate common
fs.readdirSync(rootPathJoin('core/common')).forEach(f => common['concierge/' + path.parse(f).name] = rootPathJoin('core/common', f));

const getActualName = (mod) => common[mod] || mod;

global.requireHook = (req, dirName) => {
    if (!runOnce) { // prevent re-init
        let newPath = process.env.NODE_PATH || '';
        if (newPath.length > 0) {
            newPath += /^win/.test(process.platform) ? ';' : ':';
        }
        newPath += global.rootPathJoin('node_modules');
        process.env.NODE_PATH = newPath;
        require('module').Module._initPaths();
        runOnce = true;
    }

    const func = (mod) => {
        mod = getActualName(mod);
        return inst.requireOrInstall(req, mod, dirName);
    };
    for (let key in req) {
        func[key] = req[key];
    }

    func.searchCache = (moduleName, callback) => {
        moduleName = getActualName(moduleName);
        let mod = func.resolve(moduleName);
        if (mod && (typeof (mod = func.cache[mod]) !== 'undefined')) {
            (function run(mod) {
                mod.children.forEach((child) => {
                    run(child);
                });
                callback(mod);
            })(mod);
        }
    };

    func.uncache = (moduleName) => {
        moduleName = getActualName(moduleName);
        func.searchCache(moduleName, (mod) => {
            delete func.cache[mod.id];
        });

        Object.keys(module.constructor._pathCache).forEach((cacheKey) => {
            if (cacheKey.indexOf(moduleName) > 0) {
                delete module.constructor._pathCache[cacheKey];
            }
        });
    };

    func.reload = (moduleName) => {
        moduleName = getActualName(moduleName);
        func.uncache(moduleName);
        return func(moduleName);
    };

    func.once = (moduleName) => {
        moduleName = getActualName(moduleName);
        const mod = func(moduleName);
        func.uncache(moduleName);
        return mod;
    };

    return func;
};
