/**
* Main platform. Handles the core interop of the program and
* acts as the glue code for the various parts of the code.
*
* Written By:
*         Matthew Knox
*
* License:
*        MIT License. All code unless otherwise specified is
*        Copyright (c) Matthew Knox and Contributors 2015.
*/

const figlet = require('figlet'),
    EventEmitter = require('events').EventEmitter;

class Platform extends EventEmitter {
    constructor(integrations) {
        super();
        this.config = require.once('./config.js');
        this.integrationManager = require.once('./integrations/integrations.js');
        this.integrationManager.setIntegrations(integrations);
        this.defaultPrefix = '/';
        this.packageInfo = require.once('../package.json');
        this.modulesLoader = require.once('./modules/modules.js');
        this.statusFlag = global.StatusFlag.NotStarted;
        this.onShutdown = null;
        this.waitingTime = 250;
        this.packageInfo.name = this.packageInfo.name.toProperCase();
    }

    _handleTransaction (module, args) {
        let returnVal = null;
        const timeout = setTimeout(function () {
            if (returnVal !== null) {
                return;
            }
            args[0].sendTyping(args[1].thread_id);
        }, this.waitingTime);
        try {
            returnVal = module.run.apply(this, args);
        }
        catch (e) {
            args[0].sendMessage($$`${args[1].body} failed ${args[1].sender_name} caused it`, args[1].thread_id);
            console.critical(e);
        }
        finally {
            clearTimeout(timeout);
        }

        return returnVal;
    }

    onMessage (api, event) {
        let matchArgs = [event, api.commandPrefix],
            runArgs = [api, event],
            loadedModules = this.modulesLoader.getLoadedModules();

        event.module_match_count = 0;
        for (let i = 0; i < loadedModules.length; i++) {
            let matchResult;
            try {
                matchResult = loadedModules[i].match.apply(loadedModules[i], matchArgs);
            }
            catch (e) {
                console.error($$`BrokenModule ${loadedModules[i].name}`);
                console.critical(e);
                continue;
            }

            if (matchResult) {
                event.module_match_count++;
                let transactionRes = this._handleTransaction(loadedModules[i], runArgs);
                if (event.shouldAbort || transactionRes) {
                    return;
                }
            }
        }
    }

    getIntegrationApis () {
        let integs = this.integrationManager.getSetIntegrations(),
            apis = {};
        for (let key in integs) {
            if (!integs.hasOwnProperty(key)) {
                continue;
            }
            apis[key] = integs[key].getApi();
        }
        return apis;
    }

    _firstRun () {
        const git = require.once('./git.js'),
            path = require('path'),
            defaultModules = [
                ['https://github.com/concierge/creator.git', 'creator'],
                ['https://github.com/concierge/help.git', 'help'],
                ['https://github.com/concierge/kpm.git', 'kpm'],
                ['https://github.com/concierge/ping.git', 'ping'],
                ['https://github.com/concierge/restart.git', 'restart'],
                ['https://github.com/concierge/shutdown.git', 'shutdown'],
                ['https://github.com/concierge/update.git', 'update']
            ];

        for (let i = 0; i < defaultModules.length; i++) {
            console.warn($$`Attempting to install module from "${defaultModules[i][0]}"`);
            git.clone(defaultModules[i][0], path.join(global.__modulesPath, defaultModules[i][1]), (err) => {
                if (err) {
                    console.critical(err);
                    console.error($$`Failed to install module from "${defaultModules[i][0]}"`);
                }
                else {
                    console.warn($$`"${defaultModules[i][1]}" (${'core_' + this.packageInfo.version}) is now installed.`);
                }
            });
        }
    }

    start () {
        if (this.statusFlag !== global.StatusFlag.NotStarted) {
            throw new Error($$`StartError`);
        }

        console.title(figlet.textSync(this.packageInfo.name.toProperCase()));

        console.title(' ' + this.packageInfo.version);
        console.info('------------------------------------');
        console.warn($$`StartingSystem`);

        // Load system config
        console.warn($$`LoadingSystemConfig`);
        $$.setLocale(this.config.getConfig('i18n').locale);
        this.integrationManager.setIntegrationConfigs(this);
        let firstRun = this.config.getConfig('firstRun');
        if (!firstRun.hasRun) {
            firstRun.hasRun = true;
            this._firstRun();
        }
        this.allowLoopback = !!this.config.getConfig('loopback').enabled;

        // Load modules
        console.warn($$`LoadingModules`);
        this.modulesLoader.loadAllModules(this);

        // Starting output
        console.warn($$`StartingIntegrations`);
        this.integrationManager.startIntegrations(this.onMessage.bind(this));

        this.statusFlag = global.StatusFlag.Started;
        console.warn($$`SystemStarted` + ' ' + $$`HelloWorld`.rainbow);
    }

    shutdown (flag) {
        if (this.statusFlag !== global.StatusFlag.Started) {
            throw new Error($$`ShutdownError`);
        }
        if (!flag) {
            flag = global.StatusFlag.Unknown;
        }

        // Stop output integrations
        this.integrationManager.stopIntegrations();

        // Unload user modules
        this.modulesLoader.unloadAllModules(this.config);

        this.config.saveSystemConfig();
        this.statusFlag = flag ? flag : global.StatusFlag.Shutdown;

        console.warn($$`${this.packageInfo.name} Shutdown`);
        this.emit('shutdown', this.statusFlag);
    }
};

module.exports = Platform;
