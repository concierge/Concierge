var exec = require('child_process').exec,
    path = require('path'),
    gitRootDir = '../',

    commandWithPath = function(path, args, callback) {
        args.unshift('git');
        var cmd = args.join(' ');
        exec(cmd, {cwd: path }, function(error, stdout, stderr) {
            if (error) {
                return callback(error, stderr);
            }
            callback(null, stdout);
        });
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
