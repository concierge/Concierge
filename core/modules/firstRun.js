const fs = require('fs'),
    path = require('path'),
    git = require('concierge/git');

const getJson = file => {
    return JSON.parse(fs.readFileSync(file));
};

module.exports = (bypassInit, config, modulesLoader) => {
    if (bypassInit) {
        return;
    }
    let defaultModules;
    try {
        defaultModules = getJson(global.rootPathJoin('defaults.json'));
    }
    catch (e) {
        let defaultsList = config.getSystemConfig('defaults').list;
        if (!defaultsList && process.env.CONCIERGE_DEFAULTS) {
            defaultsList = JSON.parse(process.env.CONCIERGE_DEFAULTS);
        }
        defaultModules = defaultsList || [
            ['https://github.com/concierge/boss.git', 'boss'],
            ['https://github.com/concierge/config.git', 'config'],
            ['https://github.com/concierge/creator.git', 'creator'],
            ['https://github.com/concierge/help.git', 'help'],
            ['https://github.com/concierge/kpm.git', 'kpm'],
            ['https://github.com/concierge/ping.git', 'ping'],
            ['https://github.com/concierge/restart.git', 'restart'],
            ['https://github.com/concierge/shutdown.git', 'shutdown'],
            ['https://github.com/concierge/update.git', 'update'],
            ['https://github.com/concierge/test.git', 'test']
        ];
    }

    for (let def of defaultModules) {
        console.warn($$`Attempting to install module from "${def[0]}"`);
        const installPath = path.join(global.__modulesPath, def[1]);
        git.clone(def[0], installPath, (err) => {
            if (err) {
                console.critical(err);
                console.error($$`Failed to install module from "${def[0]}"`);
            }
            else {
                ;
                console.warn($$`"${def[1]}" (${getJson(path.join(installPath, 'kassy.json')).version}) is now installed.`);
            }
        });
    }
    modulesLoader.loadAllModules();
};