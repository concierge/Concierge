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
    if (typeof(dir) === 'undefined') {
        dir = global.__rootPath;
    }
    else if (typeof(dir) === 'function') {
        callback = dir;
        dir = global.__rootPath;
    }
    const envVars = process.env.TRAVIS_PULL_REQUEST_BRANCH || process.env.TRAVIS_BRANCH || process.env.APPVEYOR_REPO_BRANCH;
    if (envVars) {
        callback(envVars);
        return envVars;
    }
    return await commandWithPath(dir, ['symbolic-ref', '--short', 'HEAD'], callback);
};

exports.clone = async(url, dir, callback) => {
    const args = ['clone', url, dir];
    if (process.env.CLONE_TRY_UPSTREAM) {
        const currentBranchName = await exports.getCurrentBranchName();
        const desiredBranch = `upstream/${currentBranchName.split('/').pop()}`;
        try {
            LOG.silly(`Changing checkout branch of "${dir}" to "${desiredBranch}".`);
            return await command(args.concat(['-b', desiredBranch]), callback);
        }
        catch (e) {
            LOG.silly('Branch change failed, resorting to HEAD.');
        }
    }
    return await command(args, callback);
};

exports.submoduleUpdate = async(callback) => {
    return await command(['submodule', 'update', '--init', '--recursive'], callback);
};
