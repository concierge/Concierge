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

const babylon = require('babylon'),
    inst = require('./install.js');
let runOnce = false;

global.__fs = require('fs');
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
        return inst.requireOrInstall(req, mod, dirName);
    };
    for (let key in req) {
        func[key] = req[key];
    }
    func.safe = func;

    func.searchCache = (moduleName, callback) => {
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
        func.uncache(moduleName);
        return func(moduleName);
    };

    func.once = (moduleName) => {
        const mod = func(moduleName);
        func.uncache(moduleName);
        return mod;
    };

    return func;
};

module.exports = () => {
    return {
        visitor: {
            Program(path) {
                path.unshiftContainer('body', babylon.parse(module.exports.injectionString).program.body[0]);
            }
        }
    };
};

module.exports.injectionString = 'require = global.requireHook(require,__dirname);';

exports.default = module.exports;
