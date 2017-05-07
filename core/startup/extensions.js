/**
 * Extensions to the standard type prototypes and global definitions.
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2017.
 */

module.exports = (rootPath, direct) => {
    if (global.__rootPath) {
        throw new Error('There can be only one instance per process.');
    }

    const path = require('path'),
        cwd = process.cwd();
    // Arbitary location module loading requirements
    global.__rootPath = rootPath;
    global.__runAsLocal = rootPath === cwd;
    global.__runAsRequired = !direct;
    global.rootPathJoin = (...args) => {
        const root = !global.__runAsLocal && args[0].startsWith('modules') ? cwd : global.__rootPath;
        return path.join.apply(this, [root].concat(args));
    };
    global.__modulesPath = global.__runAsLocal ? global.rootPathJoin('modules/') : cwd;
    global.moduleNameFromPath = p => {
        if (!p || !p.startsWith(global.__modulesPath)) {
            return null;
        }
        const add = global.__modulesPath.endsWith(path.sep) ? 0 : 1;
        const trimmed = p.substr(global.__modulesPath.length + add);
        let index = trimmed.indexOf(path.sep);
        if (index < 0) {
            index = trimmed.length;
        }
        const res = trimmed.substr(0, index);
        if (res === 'node_modules') {
            return null;
        }
        return res;
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
        }],
        ignore: filename => {
            let file = path.resolve(filename);
            if (file.startsWith(global.__rootPath)) {
                file = file.substr(global.__rootPath.length);
            }
            return file.split(path.sep).indexOf('node_modules') >= 0;
        }
    });
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

    // logging modifications
    require(rootPathJoin('core/unsafe/logging.js'));

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

    // process.emitWarning fallback
    if (!process.emitWarning) {
        process.emitWarning = (warning) => {
            console.error(`(node: 56338) Warning: ${warning}`);
        };
    }
};
