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
 *        Copyright (c) Matthew Knox and Contributors 2017.
 */

'use strict';

const npm = require(global.rootPathJoin('core/common/npm.js')),
    path = require('path'),
    fs = require('fs'),
    nativeReloadHacksCache = {},
    nativeReloadHacks = ['deasync'],
    npmFolder = 'node_modules',
    npmDirectory = global.rootPathJoin(npmFolder),
    npmLocalDirective = 'package.json',
    coreDirectory = global.rootPathJoin('core'),
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
 * Detect if a code module needs to be installed through NPM without using any internal node
 * require mechanisms. This needs to be done manually, because newer versions of node cache resolve/require
 * lookups, which means that after they have been installed they will not be detected by using require().
 * @param {string} request the lookup to perform.
 * @param {string} dirName relative directory to perform the lookup from.
 * @returns {boolean} if the module has already been installed.
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
            const npmDirs = [];
            const modName = global.moduleNameFromPath(dirName);
            if (modName === null) {
                npmDirs.push(path.join(dirName, npmFolder, request));
            }
            else {
                npmDirs.push(path.join(global.__modulesPath, modName, npmFolder, request));
            }
            if (global.__runAsLocal || dirName.startsWith(coreDirectory)) {
                npmDirs.push(path.join(npmDirectory, request));
            }
            if (global.__runAsRequired) {
                npmDirs.push(path.join(global.__modulesPath, npmFolder, request));
            }
            for (let n of npmDirs) {
                try {
                    const dir = fs.statSync(n);
                    if (dir && dir.isDirectory()) {
                        return true;
                    }
                } catch (e2) {}
            }
            throw new Error();
        }
    }
    catch (e) {
        return parsed.dir.indexOf('.') === 0;
    }
};

/**
 * Determines if an NPM install should be performed in a modules directory.
 * @param {string} dirName the directory of the module
 * @param {string} name the name of the package that is being installed
 * @returns {boolean} if NPM install should be run on the directory.
 */
const shouldInstallLocally = (dirName, name) => {
    try {
        if (!global.__runAsLocal) {
            const mock = {
                dependencies: {}
            };
            mock.dependencies[name] = '*';
            return mock;
        }
        const p = path.join(dirName, npmLocalDirective),
            d = fs.statSync(p);
        if (dirName.startsWith(global.__modulesPath) && d.isFile()) {
            return JSON.parse(fs.readFileSync(p));
        }
        return false;
    }
    catch (e) {
        return false;
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
        const local = shouldInstallLocally(dirName, name);
        let cwd = global.__rootPath,
            npmName = name;
        if (local) {
            cwd = dirName;
            const ver = local.dependencies[name] || local.devDependencies[name];
            npmName = `${name}@${ver}`;
        }
        const t = global.$$, // translations might not have loaded
            startStr = t ? t`Installing "${npmName}" from npm.` : `Installing "${npmName}" from npm.`,
            endStr = t ? t`Installation complete.` : 'Installation complete.';

        console.info(startStr);
        npm.installSync([npmName], cwd);
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
        if (!p.contains(npmDirectory) && !nativeModules.includes(mod)) {
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

    func.forcePackageInstall = async(dir) => {
        const locally = shouldInstallLocally(dir);
        let stat = null;
        try {
            stat = fs.statSync(path.join(dir, npmFolder));
        }
        catch (e) {}
        try {
            if (global.__runAsLocal && !stat && locally && Object.keys(locally.dependencies).length > 0) {
                await npm.install(Object.keys(locally.dependencies).map(d => `${d}@${locally.dependencies[d]}`), dir);
            }
        }
        catch (e) {} // ignoring is an ugly solution, but this code *must not fail*
    };

    func.searchCache = (moduleName, callback) => {
        moduleName = getActualName(moduleName);
        let mod = func.resolve(moduleName);
        if (mod && (typeof (mod = func.cache[mod]) !== 'undefined')) {
            let ran_children = [];
            const run = (m) => {
                if (m.children !== null) {
                    m.children.forEach((child) => {
                        if (!child.hasRun) {
                            child.hasRun = true;
                            ran_children.push(child);
                            run(child);
                        }
                    });
                }
                callback(mod);
            };
            run(mod);

            for (let child of ran_children) {
                delete child.hasRun;
            }
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
            LOG.silly(`mod: ${mod}\ncontext: ${context}\ncurr: ${curr}\nrefs: ${refs}`);
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
