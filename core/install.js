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
                orig = cs._compileFile;
            cs._compileFile = function () {
                let res = orig.apply(this, arguments);
                return require('./require.js').injectionString + res;
            };
            csHasLoaded = true;
        }
    },

    install = function(name) {
        console.info($$`Installing "${name}" from npm.`);
        command(['install', name]);
        console.info($$`Installation complete.`);
    };

exports.requireOrInstall = function (req, name) {
    coffeescriptRequireInjector();
    let parsed = path.parse(name);
    if (((parsed.ext === '.js' || parsed.ext === '.coffee') && 
        (parsed.dir.startsWith('.') || parsed.dir.startsWith('/') || parsed.dir.startsWith('\\'))) || parsed.root.length > 0) {
        return req(name); // try to prevent needless npm install
    }

    try {
        return req(name);
    }
    catch (e) {
        if (!e || !e.code || e.code !== 'MODULE_NOT_FOUND') {
            throw e;
        }
        try {
            fs.statSync(name);
        }
        catch (p) {
            install(name);
        }
    }

    return require(name);
};

exports.update = function() {
    command(['update']);
};
