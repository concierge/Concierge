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
    MiddlewareHandler = require.once('./middleware.js'),
    ConfigService = require.once('./config.js');

class Platform extends MiddlewareHandler {
    constructor() {
        super();
        this.config = new ConfigService();
        this.defaultPrefix = '/';
        this.packageInfo = require.once('../package.json');
        this.modulesLoader = require.once('./modules/modules.js');
        this.statusFlag = global.StatusFlag.NotStarted;
        this.onShutdown = null;
        this.waitingTime = 250;
        this.packageInfo.name = this.packageInfo.name.toProperCase();

        global.shim = require.once('./shim.js');
        global.shim.current = this;
    }

    _handleTransaction (module, args) {
        let returnVal = null;
        const timeout = setTimeout(() => {
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

    _handleMessage(api, event) {
        const matchArgs = [event, api.commandPrefix],
            runArgs = [api, event],
            loadedModules = this.modulesLoader.getLoadedModules('module');

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
                const transactionRes = this._handleTransaction(loadedModules[i], runArgs);
                if (event.shouldAbort || transactionRes) {
                    return;
                }
            }
        }
        this.emitAsync('message', api, event);
    }

    onMessage(api, event) {
        this.runMiddleware('before', this._handleMessage, api, event);
    }

    getIntegrationApis () {
        const integs = this.modulesLoader.getLoadedModules('integration'),
            apis = {};
        for (let i of integs) {
            if (i.__running) {
                apis[i.__descriptor.name] = i.getApi();
            }
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
                ['https://github.com/concierge/update.git', 'update'],
                ['https://github.com/concierge/test.git', 'test']
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

    start(integrations) {
        if (this.statusFlag !== global.StatusFlag.NotStarted) {
            throw new Error($$`StartError`);
        }

        console.title(figlet.textSync(this.packageInfo.name.toProperCase()));

        console.title(` ${this.packageInfo.version}`);
        console.info('------------------------------------');
        console.warn($$`StartingSystem`);

        // Load system config
        console.warn($$`LoadingSystemConfig`);
        $$.setLocale(this.config.getSystemConfig('i18n').locale);
        const firstRun = this.config.getSystemConfig('firstRun');
        if (!firstRun.hasRun) {
            firstRun.hasRun = true;
            this._firstRun();
        }
        this.allowLoopback = !!this.config.getSystemConfig('loopback').enabled;

        // Load modules
        console.warn($$`LoadingModules`);
        this.modulesLoader.loadAllModules(this);

        console.warn($$`StartingIntegrations`);
        for (let integration of integrations) {
            try {
                this.modulesLoader.startIntegration(this.onMessage.bind(this), integration);
            }
            catch (e) {
                if (e.message === 'Cannot find integration to start') {
                    console.error(`Unknown integration '${integration}'`);
                }
                else {
                    console.critical(e);
                }
            }
        }

        this.statusFlag = global.StatusFlag.Started;
        console.warn($$`SystemStarted` + ' ' + $$`HelloWorld`.rainbow);
    }

    shutdown(flag) {
        if (this.statusFlag !== global.StatusFlag.Started) {
            throw new Error($$`ShutdownError`);
        }

        this.emit('preshutdown');
        if (!flag) {
            flag = global.StatusFlag.Unknown;
        }

        // Unload user modules
        this.modulesLoader.unloadAllModules(this.config);

        this.config.saveConfig();
        this.statusFlag = flag ? flag : global.StatusFlag.Shutdown;

        console.warn($$`${this.packageInfo.name} Shutdown`);
        this.emit('shutdown', this.statusFlag);
    }
};

module.exports = Platform;
