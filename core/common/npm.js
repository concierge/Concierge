const exec = require('child_process').execSync;

/**
 * Executes the provided NPM command(s).
 * @param {Array<string>} args arguments to pass to NPM
 * @param {string} cwd the working directory to operate in. Defaults to the root directory if not provided.
 */
module.exports = (args, cwd) => {
    if (!cwd) {
        cwd = global.__rootPath;
    }
    args.unshift('npm', '--silent');
    exec(args.join(' '), { cwd: cwd });
};

/**
 * Perform an NPM install in the root directory of the program.
 * @param {Array<string>} args additional arguments to pass to NPM
 */
module.exports.install = (args) => {
    module.exports(['install'].concat(args));
};

/**
 * Perform an NPM update in the root directory of the program.
 * @param {Array<string>} args additional arguments to pass to NPM
 */
module.exports.update = (args) => {
    module.exports(['update'].concat(args));
};
