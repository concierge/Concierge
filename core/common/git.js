/**
 * Provides helper functions for working with git.
 *
 * Written By:
 *              Matthew Knox
 *
 * License:
 *              MIT License. All code unless otherwise specified is
 *              Copyright (c) Matthew Knox and Contributors 2017.
 */

const exec = require('child_process').exec,

    commandWithPath = (path, args, callback = () => {}) => {
        args.unshift('git');
        args.forEach((seg, index, arr) => arr[index] = `"${seg}"`);
        const cmd = args.join(' ');
        return new Promise((resolve, reject) => {
            exec(cmd, {cwd: path}, (error, stdout, stderr) => {
                stdout = stdout ? stdout.toString() : null;
                if (!error) {
                    return callback(null, stdout), resolve(stdout);
                }
                if (stderr) {
                    error.stderr = LOG.error(stderr.toString()), stderr;
                }
                error.stdout = stdout;
                return callback(error, stdout), reject(error);
            });
        });
    },

    command = async(args, callback) => {
        await commandWithPath(global.__rootPath, args, callback);
    };

exports.pull = async(callback) => {
    await command(['pull'], callback);
};

exports.pullWithPath = async(path, callback) => {
    await commandWithPath(path, ['pull'], callback);
};

exports.getSHAOfHead = async(callback) => {
    await command(['rev-parse', '--verify', 'HEAD'], callback);
};

exports.getSHAOfRemoteMaster = async(callback) => {
    await command(['rev-parse', '--verify', 'origin/master'], callback);
};

exports.getCurrentBranchName = async(callback) => {
    await command(['symbolic-ref', '--short', 'HEAD'], callback);
};

exports.clone = async(url, dir, callback) => {
    await command(['clone', url, dir], callback);
};

exports.submoduleUpdate = async(callback) => {
    await command(['submodule', 'update', '--init', '--recursive'], callback);
};
