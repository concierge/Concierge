var startTime,

difference = function (dateFrom, dateTo) {
    // http://stackoverflow.com/questions/17732897/difference-between-two-dates-in-years-months-days-in-javascript
    var diff = { TotalMs: dateTo - dateFrom };
    diff.Days = Math.floor(diff.TotalMs / 86400000);
    
    var remHrs = diff.TotalMs % 86400000;
    var remMin = remHrs % 3600000;
    var remS = remMin % 60000;
    
    diff.Hours = Math.floor(remHrs / 3600000);
    diff.Minutes = Math.floor(remMin / 60000);
    diff.Seconds = Math.floor(remS / 1000);
    //diff.Milliseconds = Math.floor(remS % 1000);
    return diff;
};

exports.match = function(text, commandPrefix) {
    return text === commandPrefix + 'uptime';
};

exports.run = function(api, event) {
    var date = new Date(),
        diff = difference(startTime, date);
    api.sendMessage('I\'ve been alive for ' + diff.Days + ' days, ' + diff.Hours + ' hours, ' + diff.Minutes + ' minutes and ' + diff.Seconds + ' seconds.', event.thread_id);
    return false;
};

exports.load = function() {
    startTime = new Date();
};

exports.help = function(commandPrefix) {
    return [[commandPrefix + 'uptime','Shows how long the platform has been alive']];
};
