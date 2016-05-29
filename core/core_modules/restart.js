exports.match = function(event, commandPrefix) {
    return event.body === commandPrefix + 'restart';
};

exports.run = function(api, event) {
    var msg = 'Admin: restart procedure requested.\n' +
        'Admin: do you wish to restart?\n' + this.packageInfo.name + ': What do you think.\n' +
        'Admin: interpreting vauge answer as \'yes\'.\n' +
        this.packageInfo.name + ': nononononono.\n' +
        'Admin: stalemate detected. Stalemate resolution associate please press the stalemate resolution button.\n' +
        this.packageInfo.name + ': I\'ve removed the button.\n' +
        'Admin: restarting anyway.\n' +
        this.packageInfo.name + ': nooooooooooo.....\n' +
        'Admin: ' + this.packageInfo.name + ' Rebooting. Please wait for restart to complete.\n';
    api.sendMessage(msg, event.thread_id);
    this.shutdown(StatusFlag.ShutdownShouldRestart);
    return false;
};

exports.help = function(commandPrefix) {
    return [[commandPrefix + 'restart', 'Restarts the platform', 'If restart fails manual intervention may be required.']];
};
