/**
* Provides a means to install missing dependencies at runtime.
*
* Written By:
*              Matthew Knox
*
* License:
*              MIT License. All code unless otherwise specified is
*              Copyright (c) Matthew Knox and Contributors 2016.
*/

const exec = require('child_process').execSync,
    path = require('path'),
    fs = require('fs'),
    nativeReloadHacksCache = {},
    nativeReloadHacks = ['deasync'],
    npmDirectory = global.rootPathJoin('node_modules'),
    nativeModules = Object.getOwnPropertyNames(process.binding('natives'));

const command = (args) => {
    args.unshift('npm', '--silent');
    exec(args.join(' '), {cwd:global.__rootPath});
};

const install = (name) => {
    const t = global.$$, // translations might not have loaded
        startStr = t ? t`Installing "${name}" from npm.` : `Installing "${name}" from npm.`,
        endStr = t ? t`Installation complete.` : `Installation complete.`;

    console.info(startStr);
    command(['install', name]);
    console.info(endStr);
};

const resolve = function (request, dirName) {
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

exports.requireOrInstall = (req, name, dirName) => {
    if (!resolve(name, dirName)) {
        install(name);
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

exports.update = () => {
    command(['update']);
};
