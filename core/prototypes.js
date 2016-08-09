/**
 * Extensions to the standard type prototypes.
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2015.
 */
'use strict';

var path = require('path');
require('babel-register')({
    plugins: [
        path.join(__dirname, 'require.js')
    ]
});
require('babel-polyfill');

// string.toProperCase
if (typeof String.prototype.toProperCase !== 'function') {
    String.prototype.toProperCase = function () {
        return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };
}

// string.contains
if (typeof String.prototype.contains !== 'function') {
    String.prototype.contains = function(str) {
        return this.indexOf(str) !== -1;
    };
}

// string.capitaliseFirst
if (typeof String.prototype.capitiliseFirst !== 'function') {
    String.prototype.capitiliseFirst = function () {
        if (this.length >= 2) {
            return this[0].toUpperCase() + this.substring(1);
        }
        return this;
    };
}
