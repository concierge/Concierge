var exec = require('child_process').execSync,
    path = require('path'),
    gitRootDir = '../',

    commandWithPath = function(path, args, callback) {
        args.unshift('git');
        var cmd = args.join(' ');
        try {
            var stdOut = exec(cmd, {cwd:path});
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

    command = function(args, callback) {
        commandWithPath(path.resolve(__dirname, gitRootDir), args, callback);
    };

exports.pull = function(callback) {
    command(['pull'], callback);
};

exports.pullWithPath = function(path, callback) {
    commandWithPath(path, ['pull'], callback);
};

exports.getSHAOfHead = function(callback) {
    command(['rev-parse', '--verify', 'HEAD'], callback);
};

exports.getSHAOfRemoteMaster = function(callback) {
    command(['rev-parse', '--verify', 'origin/master'], callback);
};

exports.getCurrentBranchName = function(callback) {
    command(['symbolic-ref', '--short', 'HEAD'], callback);
};

exports.clone = function(url, dir, callback) {
    command(['clone', url, dir], callback);
};

exports.submoduleUpdate = function(callback) {
    command(['submodule', 'update', '--init', '--recursive'], callback);
};
