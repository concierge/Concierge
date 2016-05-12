var shutdownResponses = ['Good Night', 'I don\'t blame you.', 'There you are.', 'Please.... No, Noooo!'];

exports.match = function (event, commandPrefix) {
    return event.body === commandPrefix + 'shutdown';
};

exports.run = function(api, event) {
    var index = Math.floor(Math.random() * shutdownResponses.length);
    api.sendMessage(shutdownResponses[index], event.thread_id);
    this.shutdown();
    return false;
};

exports.help = function(commandPrefix) {
    return [[commandPrefix + 'shutdown','Shuts down the platform', 'The platform may take up to 30 seconds to shutdown fully, this is dependant on output modules.']];
};
