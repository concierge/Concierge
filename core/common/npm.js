/**
 * Provides helper methods for working with NPM.
 *
 * Written By:
 *              Matthew Knox
 *
 * License:
 *              MIT License. All code unless otherwise specified is
 *              Copyright (c) Matthew Knox and Contributors 2017.
 */

const exec = require('child_process').execSync;

/**
 * Executes the provided NPM command(s).
 * @param {Array<string>} args arguments to pass to NPM
 * @param {string} cwd the working directory to operate in. Defaults to the root directory if not provided.
 * @return the stdout output from NPM.
 */
module.exports = (args, cwd) => {
    if (!cwd) {
        cwd = global.__rootPath;
    }
    args.unshift('npm', '--silent');
    const res = exec(args.join(' '), { cwd: cwd });
    return res ? res.toString() : '';
};

/**
 * Perform an NPM install in the root directory of the program.
 * @param {Array<string>} args additional arguments to pass to NPM
 * @param {string} cwd working directory, defaults to global.
 */
module.exports.install = (args, cwd) => {
    module.exports(['install'].concat(args || []), cwd);
};

/**
 * Perform an NPM update in the root directory of the program.
 * @param {Array<string>} args additional arguments to pass to NPM
 * @param {string} cwd working directory, defaults to global.
 */
module.exports.update = (args, cwd) => {
    module.exports(['update'].concat(args || []), cwd);
};
