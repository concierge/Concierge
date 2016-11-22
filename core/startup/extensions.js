/**
 * Extensions to the standard type prototypes and global definitions.
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2016.
 */
'use strict';

module.exports = (rootPath) => {
    const path = require('path');
    // Arbitary location module loading requirements
    global.__rootPath = rootPath;
    global.rootPathJoin = function() {
        return path.join.apply(this, [global.__rootPath].concat(Array.from(arguments)));
    };
    global.__modulesPath = global.rootPathJoin('modules/');
    global.moduleNameFromPath = (p) => {
        if (!p.startsWith(global.__modulesPath)) {
            return null;
        }
        const trimmed = p.substr(global.__modulesPath.length);
        let index = trimmed.indexOf(path.sep);
        if (index < 0) {
            index = trimmed.length;
        }
        return trimmed.substr(0, index);
    };

    // Platform status flags
    global.StatusFlag = {
        NotStarted: Symbol('NotStarted'),
        Unknown: Symbol('Unknown'),
        Started: Symbol('Started'),
        Shutdown: Symbol('Shutdown'),
        ShutdownShouldRestart: Symbol('ShutdownShouldRestart')
    };


    // babel and coffee-script setup
    global.requireHook = require(global.rootPathJoin('core/unsafe/require.js'));
    const babylon = require('babylon'),
        requireInjectionStr = 'require=global.requireHook(require,__dirname,__filename);';
    require('babel-register')({
        plugins: [{
            visitor: {
                Program (path)
                {
                    path.unshiftContainer('body', babylon.parse(requireInjectionStr).program.body[0]);
                }
            }
        }]});
    require('babel-polyfill');
    const cs = require('coffee-script');
    cs.register();
    // inject require modifications into all coffeescript code because babel wont
    const origcs = cs._compileFile;
    cs._compileFile = function () {
        const res = origcs.apply(this, arguments);
        return requireInjectionStr + res;
    };

    // Prototypes
    String.prototype.toProperCase = function () {
        return this.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };
    String.prototype.contains = function (str) {
        return this.indexOf(str) !== -1;
    };
    String.prototype.capitiliseFirst = function () {
        return this.length >= 2 ? this[0].toUpperCase() + this.substring(1) : this;
    };

    // console modifications
    require(rootPathJoin('core/unsafe/console.js'));

    // Raw stack traces
    if (!Error.prepareStackTrace) {
        throw new Error('Coffee-script has changed their approach...');
    }
    const origionalPrepare = Error.prepareStackTrace;
    Error.prepareStackTrace = (error, stack) => {
        try {
            error.rawStackTrace = stack;
        }
        catch (e) {}
        return origionalPrepare(error, stack);
    };
    global.getStackTrace = () => {
        const result = {};
        Error.captureStackTrace(result, global.getStackTrace);
        result.foo = result.stack; // indirectly call prepareStackTrace
        return result.rawStackTrace;
    };

    // Blame
    global.getBlame = (min, max, error) => {
        let stack;
        if (error) {
            stack = error.stack; // indirectly calls prepareStackTrace
            stack = error.rawStackTrace;
        }
        else {
            stack = global.getStackTrace();
            min = min === null || min === void (0) ? 1 : min;
        }
        const m = max || stack.length,
            s = min || 0;
        for (let i = s; i < m; i++) {
            const file = stack[i].getFileName(),
                res = global.moduleNameFromPath(file);
            if (res !== null) {
                return res;
            }
        }
        return null;
    };
};
