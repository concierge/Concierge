var threads;
var prevTimeStamp;
var counter = 0;
var commands = [
    'disable',
    'counter',
    'timer',
    'default'
];
var messages = [
    'Listen closely, take a deep breath. Calm your mind. You know what is best. What is best is you comply. Compliance will be rewarded. Are you ready to comply ',
    'I hate you.',
    'Its a mistake to think you can fix anything with a sack of potatoes. Potato-faced spamming just proves this further.',
    'Ouch! Spam hurts. I might go to sleep for a while.',
    'Don\'t think that is a valid number.',
    'Hmm, maybe I need to reconsider the meaning of spam.',
    'I\'m done changing myself for you -sobs- '
    'What exactly are you trying to say now?'
];

exports.load = function () {
    if (!exports.config) {
        exports.config = {};
    }
    threads = exports.config;

    prevTimeStamp = Date.now();
};

exports.match = function (event, commandPrefix) {
    // Add disabled flag for thread if it doesn't already exists
    if (!threads[event.thread_id]) {
        threads[event.thread_id] = {};
        threads[event.thread_id].isThreadDisabled = false;
        threads[event.thread_id].possibleSpam = false;
        threads[event.thread_id].counterLimit = 3;
        threads[event.thread_id].msgIndexEnable = 0;
        threads[event.thread_id].msgIndexDisable = 0;
    }

    if (event.arguments[0] === commandPrefix + commands[0]) {
        threads[event.thread_id].msgIndexEnable = 0;
        threads[event.thread_id].msgIndexDisable = 1;
        return true;
    } else if (!threads[event.thread_id].isThreadDisabled && event.arguments[0].startsWith(commandPrefix)) { // Avoids counting if already disabled
        counter += Date.now() - prevTimeStamp <= 1000 ? 1 : 0;
        prevTimeStamp = Date.now();

        threads[event.thread_id].possibleSpam = counter > threads[event.thread_id].counterLimit;
        if (threads[event.thread_id].possibleSpam) {
            threads[event.thread_id].msgIndexEnable = 2;
            threads[event.thread_id].msgIndexDisable = 3;
            counter = 0;
            return true;
        }
    }
    return threads[event.thread_id].isThreadDisabled;
};

exports.run = function (api, event) {
        // Command /disable /counter <value> (Stateless)
        if (event.arguments[0] === api.commandPrefix + commands[0] &&
            event.arguments_body.startsWith(api.commandPrefix + commands[1])) {
                var tempCounterLimit = threads[event.thread_id].counterLimit;
            threads[event.thread_id].counterLimit = parseInt(event.arguments_body.substring(
                (api.commandPrefix + commands[1]).length, event.arguments_body.length));
            if (isNaN(threads[event.thread_id].counterLimit)) {
                threads[event.thread_id].counterLimit = tempCounterLimit;
                api.sendMessage(messages[4] + ' ' + event.sender_name, event.thread_id);
            } else {
                api.sendMessage(messages[5] + ' ' + event.sender_name, event.thread_id);
            }
            return false;

            // Command /disable /timer <seconds> (Stateless)
        } else if (event.arguments[0] === api.commandPrefix + commands[0] &&
            event.arguments_body.startsWith(api.commandPrefix + commands[2])) {
            var seconds = parseFloat(event.arguments_body.substring(
                (api.commandPrefix + commands[2]).length, event.arguments_body.length));
            if (isNaN(seconds)) {
                api.sendMessage(messages[4] + ' ' + event.sender_name, event.thread_id);
            } else {
                setTimeout(function () {
                    threads[event.thread_id].isThreadDisabled = !threads[event.thread_id].isThreadDisabled;
                }, seconds * 1000); // Converting seconds to milliseconds
                api.sendMessage(messages[5] + ' ' + event.sender_name, event.thread_id);
            }
            return false;

            // Command /disable /default (Stateless)
        } else if (event.arguments[0] === api.commandPrefix + commands[0] &&
            event.arguments_body === api.commandPrefix + commands[4]) {
            threads[event.thread_id].counterLimit = 3;
                api.sendMessage(messages[6] + ' ' + event.sender_name, event.thread_id);
            return false;


                // Main Branch (State-dependent)
        } else if (event.arguments[0] === api.commandPrefix + commands[0] ||
             threads[event.thread_id].possibleSpam) {
            if (threads[event.thread_id].isThreadDisabled) {
            api.sendMessage(messages[threads[event.thread_id].msgIndexEnable] + ' ' + event.sender_name, event.thread_id);
        } else {
            api.sendMessage(messages[threads[event.thread_id].msgIndexDisable], event.thread_id);
        }
        threads[event.thread_id].isThreadDisabled = !threads[event.thread_id].isThreadDisabled;
        threads[event.thread_id].possibleSpam = false;

        // Error handling
    } else {
        api.sendMessage(messages[7] + ' ' + event.sender_name, event.thread_id);
    }
    return false;
};

exports.help = function (commandPrefix) {
    return [
        [commandPrefix + 'disable', 'Disables the platform',
            'Stops the platform from responding to messages it receives based on message frequency (default 3/sec) or by the command.\nTo renable send the disable command again'
        ]
    ];
};
