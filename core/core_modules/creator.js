exports.match = function(event, commandPrefix) {
        return event.body === commandPrefix + 'creator';
};

exports.run = function(api, event) {
        var creators = [
                'Thank you to:',
                '- Matthew Knox my awesome creator about whom nobody is allowed to insult.',
                '- Dion Woolley for my slackiness and his random, often broken contributions.',
                '- Jay Harris for my fawltyness and profoundness of being.',
                '- James Fairbairn for veing va vampire.',
                '- and the other weird people who contributed to me.'
        ];
        api.sendMessage(creators.join('\n'), event.thread_id);
        return false;
};

exports.help = function(commandPrefix) {
        return [[commandPrefix + 'creator', 'Lists contributors to this platform',
        'Does not list all contributors only a few of the people that helped build me when I was still finding my feet.\n ' +
        'And you should insult Matthew whenever you want,\nor maybe not,\nno pls,\nstap,\n......\n......\nA wild Marvin appears']];
};
