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

var babylon = require('babylon'),
    inst = require('./install.js'),
    runOnce = false;

global.requireHook = function (req) {
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

    var func = function (mod) {
        return inst.requireOrInstall(req, mod);
    };
    for (var key in req) {
        func[key] = req[key];
    }
    func.safe = func;

    func.searchCache = function (moduleName, callback) {
        var mod = func.resolve(moduleName);
        if (mod && (typeof (mod = func.cache[mod]) !== 'undefined')) {
            (function run(mod) {
                mod.children.forEach(function (child) {
                    run(child);
                });
                callback(mod);
            })(mod);
        }
    };

    func.uncache = function (moduleName) {
        func.searchCache(moduleName, function (mod) {
            delete func.cache[mod.id];
        });

        Object.keys(module.constructor._pathCache).forEach(function (cacheKey) {
            if (cacheKey.indexOf(moduleName) > 0) {
                delete module.constructor._pathCache[cacheKey];
            }
        });
    };

    func.reload = function (moduleName) {
        func.uncache(moduleName);
        return func(moduleName);
    };

    func.once = function (moduleName) {
        var mod = func(moduleName);
        func.uncache(moduleName);
        return mod;
    };

    return func;
};

module.exports = function () {
    return {
        visitor: {
            Program(path) {
                path.unshiftContainer('body', babylon.parse(module.exports.injectionString).program.body[0]);
            }
        }
    };
};

module.exports.injectionString = 'require = (global || GLOBAL).requireHook(require);';

exports.default = module.exports;
