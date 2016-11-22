/**
 * Extend CommonJS require to allow for installing (using NPM) and reloading of code
 * without doing a hard reset of the application.
 *
 * All of this code is a mess. Layers of hackery and bodges to get the desired end result.
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2016.
 */

'use strict';

const exec = require('child_process').execSync,
    path = require('path'),
    fs = require('fs'),
    nativeReloadHacksCache = {},
    nativeReloadHacks = ['deasync'],
    npmDirectory = global.rootPathJoin('node_modules'),
    nativeModules = Object.getOwnPropertyNames(process.binding('natives')),
    common = {},
    referenceCounts = {};

// populate common, allows for require('concierge/*') to be redirected to the common directory
fs.readdirSync(global.rootPathJoin('core/common')).forEach(f => {
    common['concierge/' + path.parse(f).name] = global.rootPathJoin('core/common', f);
});

// force add node_modules to the path, so that installed NPM modules will be found regardless of module install location
let newPath = process.env.NODE_PATH || '';
if (newPath.length > 0) {
    newPath += /^win/.test(process.platform) ? ';' : ':';
}
newPath += global.rootPathJoin('node_modules');
process.env.NODE_PATH = newPath;
require('module').Module._initPaths();

/**
 * Translate a modules alias to its actual name/path.
 * @param {string} mod input name
 * @returns {string} actual name/path
 */
const getActualName = (mod) => common[mod] || mod;

/**
 * Executes the provided NPM command(s).
 * @param {Array<string>} args arguments to pass to NPM
 */
const command = (args) => {
    args.unshift('npm', '--silent');
    exec(args.join(' '), { cwd: global.__rootPath });
};

/**
 * Detect if a code module needs to be installed through NPM without using any internal node
 * require mechanisms. This needs to be done manually, because newer versions of node cache resolve/require
 * lookups, which means that after they have been installed they will not be detected by using require().
 * @param request the lookup to perform.
 * @param dirName relative directory to perform the lookup from.
 */
const resolve = (request, dirName) => {
    if (nativeModules.includes(request)) {
        return true;
    }
    const parsed = path.parse(request);
    try {
        if (parsed.ext !== '' && parsed.ext !== '.' && parsed.dir !== '') {
            const p = path.resolve(dirName, request),
                file = fs.statSync(p);
            return file && (file.isFile() || file.isDirectory());
        }
        else {
            const dir = fs.statSync(path.join(npmDirectory, request));
            return dir && dir.isDirectory();
        }
    }
    catch (e) {
        return parsed.dir.indexOf('.') === 0;
    }
};

/**
 * Requires a module, installing it first from NPM if necessary.
 * @param {function()} req origional require function
 * @param {string} name name of the module to install
 * @param {string} dirName relative directory to require from
 */
const installAndRequire = (req, name, dirName) => {
    const v = resolve(name, dirName);
    if (!v) {
        const t = global.$$, // translations might not have loaded
            startStr = t ? t`Installing "${name}" from npm.` : `Installing "${name}" from npm.`,
            endStr = t ? t`Installation complete.` : 'Installation complete.';

        console.info(startStr);
        command(['install', name]);
        console.info(endStr);
    }
    else if (nativeReloadHacksCache.hasOwnProperty(name)) {
        return nativeReloadHacksCache[name];
    }
    const r = req(name);
    if (nativeReloadHacks.includes(name) || name.endsWith('.node')) {
        nativeReloadHacksCache[name] = r;
    }
    return r;
};

/**
 * A global require replacement hook. This is used to allow code-hotswapping,
 * runtime dependency installation and injection. When called, this will generate a
 * new require function that should be used within a module.
 * @param {function()} req origional require function of the module.
 * @param {string} dirName __dirname of the module
 * @param {string} fileName __filename of the module
 * @returns {function()} a replacement require function for the module.
 */
module.exports = (req, dirName, fileName) => {
    const moduleDirName = global.moduleNameFromPath(dirName) || fileName;
    if (!referenceCounts.hasOwnProperty(moduleDirName)) {
        referenceCounts[moduleDirName] = {
            self: [fileName],
            count: 'Ignore',
            refs: []
        };
    }

    const func = (mod) => {
        mod = getActualName(mod);
        const res = installAndRequire(req, mod, dirName),
            p = req.resolve(mod),
            refName = global.moduleNameFromPath(p) || p;
        if (!p.startsWith(npmDirectory) && !nativeModules.includes(mod)) {
            if (!referenceCounts.hasOwnProperty(refName)) {
                referenceCounts[refName] = {
                    self: [],
                    count: 0,
                    refs: []
                };
            }

            if (!referenceCounts[refName].self.includes(p)) {
                referenceCounts[refName].self.push(p);
            }

            if (refName !== moduleDirName && !referenceCounts[moduleDirName].refs.includes(refName)) {
                if (typeof (referenceCounts[refName].count) === 'string') {
                    referenceCounts[refName].count = 0;
                }
                referenceCounts[refName].count++;
                referenceCounts[moduleDirName].refs.push(refName);
            }
        }
        return res;
    };
    for (let key in req) {
        func[key] = req[key];
    }

    func.searchCache = (moduleName, callback) => {
        moduleName = getActualName(moduleName);
        let mod = func.resolve(moduleName);
        if (mod && (typeof (mod = func.cache[mod]) !== 'undefined')) {
            const run = (m) => {
                m.children.forEach((child) => {
                    run(child);
                });
                callback(mod);
            };
            run(mod);
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

    func.unrequire = (mod, context) => {
        mod = global.moduleNameFromPath(mod) || mod;
        context = func.resolve(context);
        const curr = global.moduleNameFromPath(context) || context,
            refs = referenceCounts[curr].refs,
            ind = refs.indexOf(mod);
        if (ind < 0) {
            throw new Error('You never required that!');
        }
        refs.splice(ind, 1);
        const uncache = [],
            queue = [mod];
        while (queue.length > 0) {
            const top = queue.shift();
            if (!referenceCounts[top]) {
                continue;
            }
            referenceCounts[top].count--;
            if (referenceCounts[top].count === 0) {
                queue.push.apply(queue, referenceCounts[top].refs);
                uncache.push.apply(uncache, referenceCounts[top].self);
                delete referenceCounts[top];
            }
        }

        for (let m of uncache) {
            func.uncache(m);
        }
    };

    func.once = (moduleName) => {
        process.emitWarning(`'require.once("${moduleName}")' is deprecated and will be removed soon. Please use 'require("${moduleName}")' instead.`);
        return func(moduleName);
    };

    func.safe = (moduleName) => {
        process.emitWarning(`'require.safe("${moduleName}")' is deprecated and will be removed soon. Please use 'require("${moduleName}")' instead.`);
        return func(moduleName);
    };

    return func;
};

/**
 * Perform an NPM update in the root directory of the program.
 */
module.exports.update = () => {
    command(['update']);
};
