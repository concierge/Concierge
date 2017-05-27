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

    commandWithPath = (path, args, callback) => {
        args.unshift('git');
        args.forEach((seg, index, arr) => arr[index] = `"${seg}"`);
        const cmd = args.join(' ');

        exec(cmd, {cwd: path}, (error, stdout, stderr) => {
            stdout = stdout ? stdout.toString() : null;
            if (error) {
                if (stderr) {
                    console.error(stderr.toString());
                }
                error.stderr = stderr;
                return callback(error, stdout);
            }
            return callback(null, stdout);
        });
    },

    command = (args, callback) => {
        commandWithPath(global.__rootPath, args, callback);
    };

exports.pull = (callback) => {
    command(['pull'], callback);
};

exports.pullWithPath = (path, callback) => {
    commandWithPath(path, ['pull'], callback);
};

exports.getSHAOfHead = (callback) => {
    command(['rev-parse', '--verify', 'HEAD'], callback);
};

exports.getSHAOfRemoteMaster = (callback) => {
    command(['rev-parse', '--verify', 'origin/master'], callback);
};

exports.getCurrentBranchName = (callback) => {
    command(['symbolic-ref', '--short', 'HEAD'], callback);
};

exports.clone = (url, dir, callback) => {
    command(['clone', url, dir], callback);
};

exports.submoduleUpdate = (callback) => {
    command(['submodule', 'update', '--init', '--recursive'], callback);
};
