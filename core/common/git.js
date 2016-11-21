const exec = require('child_process').execSync,
    path = require('path'),

    commandWithPath = (path, args, callback) => {
        args.unshift('git');
        const cmd = args.join(' ');
        try {
            const stdOut = exec(cmd, {cwd:path});
            return callback(null, stdOut.toString());
        }
        catch (error) {
            try{
                return callback(error.stderr.toString(), null);
            }
            catch (error2) {
                throw error;
            }
        }
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
