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
 
'use strict';

var hook = require('./unsafe/hook.js'),
	preventCache = [];

global.requireHook = function(req) {
    req.searchCache = function (moduleName, callback) {
        var mod = req.resolve(moduleName);
        if (mod && ((mod = req.cache[mod]) !== undefined)) {
            (function run(mod) {
                mod.children.forEach(function (child) {
                    run(child);
                });
                callback(mod);
            })(mod);
        }
    };

    req.uncache = function (moduleName) {
        req.searchCache(moduleName, function (mod) {
            delete req.cache[mod.id];
        });

        Object.keys(module.constructor._pathCache).forEach(function (cacheKey) {
            if (cacheKey.indexOf(moduleName) > 0) {
                delete module.constructor._pathCache[cacheKey];
            }
        });
    };

    req.reload = function (moduleName) {
        req.uncache(moduleName);
        return req(moduleName);
    };

    req.once = function (moduleName, preventRerequire) {
    	if (preventCache.indexOf(moduleName) !== -1) {
    		return;
    	}
    
        var mod = req(moduleName);
        req.uncache(moduleName);
        
        if (preventRerequire) {
        	preventCache.push(moduleName);
        }
        
        return mod;
    };

    req.safe = require("require-install");
};

hook.setInjectionFunction(function() {
	var __glob = global || GLOBAL;
	__glob.requireHook(require);
});
