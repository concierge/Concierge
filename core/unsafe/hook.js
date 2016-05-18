/**
 * Provides a hook into the module loading process. Allows dependencies
 * to be injected before code is actually run.
 *
 * Code in here will consist of nasty hacks to internal Node code to
 * gain access to variables/functions when they are not otherwise
 * easily accessable.
 *
 * Written By:
 * 		Matthew Knox
 *
 * License:
 *		MIT License. All code unless otherwise specified is
 *		Copyright (c) Matthew Knox and Contributors 2016.
 */

var Module      = require('module'),
    wrap        = Module.wrap,
    injectFunc  = function () { };

/*
 * Replace the wrap function - its the most easily replaceable function
 * called inside _compile() before the code of the module is executed.
 *
 * content: string - string containing text of module to be loaded.
 * returns: string - content (+ hacked additions now) wrapped in an anonymous function.
 */
Module.wrap = function (content) {
    content = '(' + injectFunc + ')(); ' + content;
    return wrap.call(this, content);
};

/*
 * Set the function that should be injected.
 * Note: everything required must be defined within this function,
 * nothing else will be accessible from the callers location.
 *
 * func: function - the function to inject.
 * returns: undefined.
 */
exports.setInjectionFunction = function(func) {
    injectFunc = func.toString();
    injectFunc = injectFunc.replace(/(\r\n|\n|\r)/gm, '');
};
