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
    MiddlewareHandler = require('./middleware.js');

class Platform extends MiddlewareHandler {
    constructor() {
        super();
        this.defaultPrefix = '/';
        this.packageInfo = require(global.rootPathJoin('package.json'));
        this.modulesLoader = new (require(global.rootPathJoin('core/modules/modules.js')))(this);
        this.statusFlag = global.StatusFlag.NotStarted;
        this.onShutdown = null;
        this.waitingTime = 250;
        this.packageInfo.name = this.packageInfo.name.toProperCase();
        global.shim = require(global.rootPathJoin('core/modules/shim.js'));
        global.shim.current = this;
        this._boundErrorHandler = (err) => {
            global.shim.current._errorHandler.call(global.shim.current, err);
        };
        process.on('uncaughtException', this._boundErrorHandler);
        process.on('unhandledRejection', this._boundErrorHandler);
    }

    _errorHandler (err, api, event) {
        const blame = global.getBlame(null, null, err) || '!CORE!';
        let message;
        if (api && event) {
            const part = `"${event.body}" (${blame})`;
            message = $$`${part} failed ${event.sender_name} caused it`;
            this.runMiddleware('error', api.sendMessage, message, event.thread_id);
        }
        else {
            const part = `"${blame}"`;
            message = $$`${part} failed ${'<unknown>'} caused it`;
        }
        console.error(message);
        console.critical(err);
        this.emitAsync('uncaughtError', err, blame, api, event);
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
            this._errorHandler(e, args[0], args[1]);
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
        const git = require('concierge/git'),
            path = require('path');
        let defaultModules;
        try {
            defaultModules = require('../defaults.json');
        }
        catch (e) {
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
        }

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
        this.modulesLoader.loadModule({
            name: 'Configuration',
            version: 1.0,
            type: ['service'],
            startup: global.__configService || global.rootPathJoin('core/modules/config.js'),
            __loaderUID: 0
        });
        this.config = this.modulesLoader.getLoadedModules('service')[0].configuration;

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
                console.info($$`Loading integration '${integration}'...\t`);
                this.modulesLoader.startIntegration(this.onMessage.bind(this), integration);
            }
            catch (e) {
                if (e.message === 'Cannot find integration to start') {
                    console.error(`Unknown integration '${integration}'`);
                }
                else {
                    console.error($$`Failed to start output integration '${integration}'.`);
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
        this.modulesLoader.unloadAllModules();
        this.statusFlag = flag ? flag : global.StatusFlag.Shutdown;

        process.removeListener('uncaughtException', this._boundErrorHandler);
        process.removeListener('unhandledRejection', this._boundErrorHandler);
        console.warn($$`${this.packageInfo.name} Shutdown`);
        this.emit('shutdown', this.statusFlag);
    }
};

module.exports = Platform;
