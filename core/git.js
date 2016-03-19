var exec = require('child_process').exec,
    path = require('path'),
    gitRootDir = '../',

    command = function(args, callback) {
        fp = path.resolve(__dirname, gitRootDir);
        args.unshift('git');
        var cmd = args.join(' ');
        exec(cmd, {cwd: fp }, function(error, stdout, stderr) {
            if (error) {
                return callback(error, stderr);
            }
            callback(null, stdout);
        });
    };

exports.pull = function(callback) {
    command(['pull'], callback);
};

exports.getSHAOfHead = function(callback) {
    command(['rev-parse', '--verify', 'HEAD'], callback);
};

exports.getSHAOfRemoteMaster = function(callback) {
    command(['rev-parse', '--verify', 'origin/master'], callback);
};

exports.getCurrentBranchName = function(callback) {
    command(['symbolic-ref' '--short' 'HEAD'], callback);
};
