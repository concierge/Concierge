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
        return await commandWithPath(global.__rootPath, args, callback);
    };

exports.pull = async(callback) => {
    return await command(['pull'], callback);
};

exports.pullWithPath = async(path, callback) => {
    return await commandWithPath(path, ['pull'], callback);
};

exports.getSHAOfHead = async(callback) => {
    return await command(['rev-parse', '--verify', 'HEAD'], callback);
};

exports.getSHAOfRemoteMaster = async(callback) => {
    return await command(['rev-parse', '--verify', 'origin/master'], callback);
};

exports.getCurrentBranchName = async(dir, callback = () => {}) => {
    if (typeof(dir) === 'function' || typeof(dir) === 'undefined') {
        callback = dir;
        dir = global.__rootPath;
    }
    const envVars = process.env.TRAVIS_PULL_REQUEST_BRANCH || process.env.TRAVIS_BRANCH;
    if (envVars) {
        callback(envVars);
        return envVars;
    }
    return await commandWithPath(dir, ['symbolic-ref', '--short', 'HEAD'], callback);
};

exports.changeBranch = async(dir, branch, callback) => {
    LOG.silly(`Changing branch of "${dir}" to "${branch}".`);
    return await commandWithPath(dir, ['checkout', branch], callback)
};

exports.clone = async(url, dir, callback) => {
    const clone = await command(['clone', url, dir], callback);
    if (!process.env.CLONE_TRY_UPSTREAM) {
        return clone;
    }
    try {
        const desiredBranch = `upstream/${(await exports.getCurrentBranchName()).split('/').pop()}`;
        await exports.changeBranch(dir, desiredBranch);
    }
    catch (e) {}
    return clone;
};

exports.submoduleUpdate = async(callback) => {
    return await command(['submodule', 'update', '--init', '--recursive'], callback);
};
