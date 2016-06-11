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

var npm = require('npm'),
    deasync = require('deasync'),
    fs = require('fs'),
    load = deasync(npm.load),
    csHasLoaded = false;

load({loglevel: 'silent'});
var inst = deasync(npm.commands.install),
    upd = deasync(npm.commands.update),

    // inject require modifications into all coffeescript code because babel wont
    coffeescriptRequireInjector = function () {
        if (!csHasLoaded && global.coffeescriptLoaded) {
            var cs = require('coffee-script'),
                orig = cs._compileFile;
            cs._compileFile = function () {
                var res = orig.apply(this, arguments);
                return require('./require.js').injectionString + res;
            };
            csHasLoaded = true;
        }
    },

    install = function(name) {
        console.info('Installing "' + name + '" from npm.');
        inst([name]);
        console.info('Installation complete.');
    };

exports.requireOrInstall = function(req, name) {
    try {
        coffeescriptRequireInjector();
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

    return req(name);
};

exports.update = function() {
    upd([]);
};
