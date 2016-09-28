/**
    * Provides a means to install missing dependencies at runtime.
    *
    * Written By:
    *              Matthew Knox
    *
    * License:
    *              MIT License. All code unless otherwise specified is
    *              Copyright (c) Matthew Knox and Contributors 2015.
    */

let exec = require('child_process').execSync,
    path = require('path'),
    fs = require('fs'),
    csHasLoaded = false,
    npmDirectory = global.rootPathJoin('node_modules'),
    nativeModules = Object.getOwnPropertyNames(process.binding('natives')),

    command = function(args) {
        args.unshift('--silent');
        args.unshift('npm');
        let cmd = args.join(' ');
        exec(cmd, {cwd:global.__rootPath});
    },

    // inject require modifications into all coffeescript code because babel wont
    coffeescriptRequireInjector = function () {
        if (!csHasLoaded && global.coffeescriptLoaded) {
            let cs = require('coffee-script'),
                orig = cs._compileFile,
                requirejs = require('./require.js');
            cs._compileFile = function () {
                let res = orig.apply(this, arguments);
                return requirejs.injectionString + res;
            };
            csHasLoaded = true;
        }
    },

    install = function(name) {
        let t = global.$$, // translations might not have loaded
            startStr = t ? t`Installing "${name}" from npm.` : `Installing "${name}" from npm.`,
            endStr = t ? t`Installation complete.` : `Installation complete.`;

        console.info(startStr);
        command(['install', name]);
        console.info(endStr);
    },

    resolve = function(request) {
        try {
            if (nativeModules.includes(request)) {
                return true;
            }
            let dir = fs.statSync(path.join(npmDirectory, request));
            return dir && dir.isDirectory();
        }
        catch (e) {
            return false;
        }
    };

exports.requireOrInstall = function (req, name) {
    coffeescriptRequireInjector();
    let parsed = path.parse(name);
    if (parsed.ext !== '' || resolve(name)) {
        return req(name);
    }

    install(name);
    return req(name);
};

exports.update = function() {
    command(['update']);
};
