/**
 * Script to extend require, allowing us to reload javascript code
 * without doing a hard reset on the application.
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2015.
 */

'use strict';

var hook = require('./unsafe/hook.js'),
    preventCache = [],
    inst = require('./install.js');

global.requireHook = function (req) {
    var func = function (mod) {
        return inst.requireOrInstall(req, mod);
    };
    for (var key in req) {
        func[key] = req[key];
    }
    func.safe = func;

    func.searchCache = function (moduleName, callback) {
        var mod = func.resolve(moduleName);
        if (mod && ((mod = func.cache[mod]) !== undefined)) {
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

    func.once = function (moduleName, preventRerequire) {
        if (preventCache.indexOf(moduleName) !== -1) {
            return;
        }

        var mod = func(moduleName);
        func.uncache(moduleName);

        if (preventRerequire) {
            preventCache.push(moduleName);
        }

        return mod;
    };

    return func;
};

hook.setInjectionFunction(function () {
    require = (global || GLOBAL).requireHook(require);
});
