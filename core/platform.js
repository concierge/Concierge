/**
* Main platform. Handles the core interop of the program and
* acts as the glue code for the various parts of the code.
*
* Written By:
*         Matthew Knox
*
* License:
*        MIT License. All code unless otherwise specified is
*        Copyright (c) Matthew Knox and Contributors 2017.
*/

const figlet = require('figlet'),
    MiddlewareHandler = require('concierge/middleware');

class Platform extends MiddlewareHandler {
    constructor (bypassInit) {
        super();
        this.bypassInit = bypassInit;
        this.defaultPrefix = '/';
        this.packageInfo = require(global.rootPathJoin('package.json'));
        this.modulesLoader = new (require(global.rootPathJoin('core/modules/modules.js')))(this);
        this.statusFlag = global.StatusFlag.NotStarted;
        this.onShutdown = null;
        this.waitingTime = 250;
        this.packageInfo.name = this.packageInfo.name.toProperCase();
        this.config = require(global.rootPathJoin('core/modules/config.js'));
        this.loopbackBuilder = require(global.rootPathJoin('core/modules/loopback.js'))(this);
        this.modulesLoader.on('loadSystem', this._loadSystemConfig.bind(this));
        global.shim = require(global.rootPathJoin('core/modules/shim.js'));
        this._boundErrorHandler = err => {
            global.currentPlatform._errorHandler.call(global.currentPlatform, err);
        };
        process.on('uncaughtException', this._boundErrorHandler);
        process.on('unhandledRejection', this._boundErrorHandler);
        this.onMessage = this.onMessage.bind(this);
        this.modulesLoader.once('loadNone', () => {
            const firstRunDir = require('path').join(global.__modulesPath, 'first-run');
            require('concierge/git').clone(process.env.CONCIERGE_DEFAULTS_REPO || 'https://github.com/concierge/first-run.git', firstRunDir, err => {
                if (!err) {
                    this.modulesLoader.loadModule(this.modulesLoader.verifyModule(firstRunDir));
                }
                else {
                    this.modulesLoader.emit('loadAll');
                }
            });
        });
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
            returnVal = this.runMiddlewareSync.apply(this,
                ['run', module.run.bind(module)].concat(args));
        }
        catch (e) {
            this._errorHandler(e, args[0], args[1]);
        }
        finally {
            clearTimeout(timeout);
        }

        return returnVal;
    }

    _handleMessage (api, event) {
        const matchArgs = [event, api.commandPrefix],
            runArgs = [api, event],
            loadedModules = this.modulesLoader.getLoadedModules('module');

        event.module_match_count = 0;
        for (let lm of loadedModules) {
            let matchResult;
            try {
                matchResult = this.runMiddlewareSync.apply(this,
                    ['match', lm.match.bind(lm)].concat(matchArgs, lm.__descriptor));
            }
            catch (e) {
                console.error($$`BrokenModule ${lm.__descriptor.name}`);
                console.critical(e);
                continue;
            }

            if (matchResult) {
                event.module_match_count++;
                const transactionRes = this._handleTransaction(lm, runArgs);
                if (event.shouldAbort || transactionRes) {
                    return;
                }
            }
        }
        this.emitAsync('message', api, event);
    }

    /**
     * Callback for integrations, for passing messages to integrations.
     * @param {Object} api the api that raised the message.
     * @param {Object} event the event that occured.
     */
    onMessage (api, event) {
        const loopBack = this.loopbackBuilder(api, event);
        this.runMiddleware('before', this._handleMessage, loopBack.api, loopBack.event);
    }

    /**
     * Gets all of the started integration APIs as a key-value pair object.
     * @return {Object} a key-value pair object of integrations.
     */
    getIntegrationApis () {
        const integs = this.modulesLoader.getLoadedModules('integration'),
            apis = {};
        for (let integ of integs.filter(i => !!i.__running)) {
            apis[integ.__descriptor.name] = integ.getApi();
        }
        return apis;
    }

    /**
     * Gets a loaded module by name or filter function.
     * @param {string|function()} arg either the name or a filter function to find the module.
     * @return {Object} the module (if found), array-like otherwise.
     * @emits Platform#started
     */
    getModule (arg) {
        const modules = this.modulesLoader.getLoadedModules('module');
        let func = arg;
        if (typeof(func) !== 'function') {
            func = mod => mod.__descriptor.name.trim().toLowerCase() === arg.trim().toLowerCase();
        }
        return modules.find(func);
    }

    _loadSystemConfig () {
        LOG.warn($$`LoadingSystemConfig`);
        $$.setLocale(this.config.getSystemConfig('i18n').locale);
    }

    /**
     * Start Concierge, load modules and start integrations.
     * @param {Array<string>} integrations list of integrations to start.
     * @param {Array<string>} modules optional list of modules to load.
     * @emits Platform#started
     */
    start (integrations, modules) {
        if (this.statusFlag !== global.StatusFlag.NotStarted) {
            throw new Error($$`StartError`);
        }

        LOG.title($$`Title ${figlet.textSync(this.packageInfo.name.toProperCase())} ${this.packageInfo.version}`);
        LOG.warn($$`StartingSystem`);

        // Load modules
        LOG.warn($$`LoadingModules`);
        this.modulesLoader.once('loadAll', () => {
            LOG.warn($$`StartingIntegrations`);
            for (let integration of integrations) {
                try {
                    LOG.info($$`Loading integration '${integration}'...\t`);
                    this.modulesLoader.startIntegration(this.onMessage, integration);
                }
                catch (e) {
                    if (e.message === 'Cannot find integration to start') {
                        LOG.error(`Unknown integration '${integration}'`);
                    }
                    else {
                        LOG.error($$`Failed to start output integration '${integration}'.`);
                        LOG.critical(e);
                    }
                }
            }
            this.statusFlag = global.StatusFlag.Started;
            LOG.warn($$`SystemStarted` + ' ' + $$`HelloWorld`.rainbow);
            this.heartBeat = setInterval(() => console.debug('Core Heartbeat'), 2147483647);
            this.emitAsync('started');
        });
        this.modulesLoader.loadAllModules(modules);
    }

    /**
     * Shutdown Concierge.
     * @param {Symbol(string)} flag shutdown status. Defaults to `global.StatusFlag.Shutdown`.
     * @emits Platform#preshutdown
     * @emits Platform#shutdown
     * @see `global.StatusFlag`
     */
    shutdown (flag) {
        if (this.statusFlag !== global.StatusFlag.Started) {
            throw new Error($$`ShutdownError`);
        }

        this.emit('preshutdown');

        // Unload user modules
        this.config.saveConfig();
        this.modulesLoader.unloadAllModules();
        this.statusFlag = flag || global.StatusFlag.Shutdown;

        process.removeListener('uncaughtException', this._boundErrorHandler);
        process.removeListener('unhandledRejection', this._boundErrorHandler);
        console.warn($$`${this.packageInfo.name} Shutdown`);
        clearInterval(this.heartBeat);
        this.emit('shutdown', this.statusFlag);
        this.removeAllListeners();
    }
}

module.exports = Platform;
