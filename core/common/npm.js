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

const util = require('util'),
    childProcess = require('child_process'),
    execSync = childProcess.execSync,
    execAsync = util.promisify(childProcess.exec);

/**
 * Executes the provided NPM command(s).
 * @param {Array<string>} args arguments to pass to NPM
 * @param {string} cwd the working directory to operate in. Defaults to the root directory if not provided.
 * @param {boolean} sync execute the npm command in a synchronous approach.
 * @return the stdout output from NPM (sync) or a promise (async).
 */
module.exports = (args, cwd, sync = false) => {
    if (!cwd) {
        cwd = global.__rootPath;
    }
    args.unshift('npm', '--silent');
    if (sync) {
        const res = execSync(args.join(' '), { cwd: cwd });
        return res ? res.toString() : '';
    }
    return execAsync(args.join(' '), { cwd: cwd });
};

/**
 * Perform an NPM install in the root directory of the program.
 * @param {Array<string>} args additional arguments to pass to NPM
 * @param {string} cwd working directory, defaults to global.
 * @return {Promise} a promise representing the npm command.
 */
module.exports.install = async(args, cwd) => {
    return await module.exports(['install'].concat(args || []), cwd);
};

/**
 * Perform an NPM install in the root directory of the program.
 * @param {Array<string>} args additional arguments to pass to NPM
 * @param {string} cwd working directory, defaults to global.
 * @return {string} the stdout of the command.
 */
module.exports.installSync = (args, cwd) => {
    return module.exports(['install'].concat(args || []), cwd, true);
};

/**
 * Perform an NPM update in the root directory of the program.
 * @param {Array<string>} args additional arguments to pass to NPM
 * @param {string} cwd working directory, defaults to global.
 * @return {Promise} a promise representing the npm command.
 */
module.exports.update = async(args, cwd) => {
    return await module.exports(['update'].concat(args || []), cwd);
};

/**
 * Perform an NPM update in the root directory of the program.
 * @param {Array<string>} args additional arguments to pass to NPM
 * @param {string} cwd working directory, defaults to global.
 * @return {string} the stdout of the command.
 */
module.exports.updateSync = (args, cwd) => {
    return module.exports(['update'].concat(args || []), cwd, true);
};
