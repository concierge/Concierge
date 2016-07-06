exports.match = function(event, commandPrefix) {
    return event.body === commandPrefix + 'creator';
};

exports.run = function(api, event) {
    var creators = [
        $$`Thank you to`,
        $$`Matthew Knox`,
        $$`Dion Woolley`,
        $$`Jay Harris`,
        $$`James Fairbairn`,
        $$`other weird people`
    ];
    api.sendMessage(creators.join('\n'), event.thread_id);
    return false;
};

exports.help = function(commandPrefix) {
    return [[commandPrefix + 'creator', $$`Lists contributors to this platform`, $$`Lists contributors to this platform extended`]];
};
