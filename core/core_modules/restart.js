exports.match = function(event, commandPrefix) {
    return event.body === commandPrefix + 'restart';
};

exports.run = function (api, event) {
    let msg = $$`Restart portal reference ${exports.platform.packageInfo.name}`;
    api.sendMessage(msg, event.thread_id);
    this.shutdown(StatusFlag.ShutdownShouldRestart);
    return false;
};

exports.help = function(commandPrefix) {
    return [[commandPrefix + 'restart', $$`Restarts the bot`, $$`Restarts the bot extended`]];
};
