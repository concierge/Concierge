/**
 * Script to extend require, allowing us to reload javascript code
 * without doing a hard reset on the application.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2015.
 */

var hook = require('./unsafe/hook.js');

hook.setInjectionFunction(function() {
    require.searchCache = function (moduleName, callback) {
        var mod = require.resolve(moduleName);
        if (mod && ((mod = require.cache[mod]) !== undefined)) {
            (function run(mod) {
                mod.children.forEach(function (child) {
                    run(child);
                });
                callback(mod);
            })(mod);
        }
    };

    require.uncache = function (moduleName) {
        require.searchCache(moduleName, function (mod) {
            delete require.cache[mod.id];
        });
        
        Object.keys(module.constructor._pathCache).forEach(function (cacheKey) {
            if (cacheKey.indexOf(moduleName) > 0) {
                delete module.constructor._pathCache[cacheKey];
            }
        });
    };

    require.reload = function (moduleName) {
        require.uncache(moduleName);
        return require(moduleName);
    };
    
    require.once = function (moduleName) {
        var mod = require(moduleName);
        require.uncache(moduleName);
        return mod;
    };

    require.safe = require("require-install");
});
