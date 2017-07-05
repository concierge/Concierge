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
    path = require('path'),
    util = require('util'),
    ModulesLoader = require(global.rootPathJoin('core/modules/modules.js')),
    ConfigurationService = require(global.rootPathJoin('core/modules/config.js')),
    LoopbackBuilder = require(global.rootPathJoin('core/modules/loopback.js')),
    PackageInfo = require(global.rootPathJoin('package.json')),
    MiddlewareHandler = require('concierge/middleware'),
    git = require('concierge/git');

class Platform extends MiddlewareHandler {
    constructor () {
        super();
        this.packageInfo = PackageInfo;
        this.config = new ConfigurationService();
        this.modulesLoader = new ModulesLoader(this);
        this.defaultPrefix = '/';
        this.onShutdown = null;
        this.waitingTime = 250;
        this.statusFlag = global.StatusFlag.NotStarted;
        this.packageInfo.name = this.packageInfo.name.toProperCase();
        this.onMessage = this.onMessage.bind(this);
        this._boundErrorHandler = this._errorHandler.bind(this);
        process.on('uncaughtException', this._boundErrorHandler);
        process.on('unhandledRejection', this._boundErrorHandler);
        this.modulesLoader.once('loadNone', this._firstRun.bind(this));
        this.modulesLoader.on('loadSystem', this._loadSystemConfig.bind(this));
    }

    async _firstRun () {
        const firstRunDir = path.join(global.__modulesPath, 'first-run');
        await git.clone(process.env.CONCIERGE_DEFAULTS_REPO || 'https://github.com/concierge/first-run.git', firstRunDir);
        this.modulesLoader.loadModule(await this.modulesLoader.verifyModule(firstRunDir));
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
        const loopBack = LoopbackBuilder.getLoopbackApi(this, api, event);
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
        return this.modulesLoader.getModule(arg);
    }

    async _loadSystemConfig () {
        LOG.warn($$`LoadingSystemConfig`);
        $$.setLocale((await this.config.getSystemConfig('i18n')).locale);
    }

    /**
     * Start Concierge, load modules and start integrations.
     * @param {Array<string>} integrations list of integrations to start.
     * @param {Array<string>} modules optional list of modules to load.
     * @emits Platform#started
     */
    async start (integrations, modules) {
        if (this.statusFlag !== global.StatusFlag.NotStarted) {
            throw new Error($$`StartError`);
        }

        LOG.title($$`Title ${figlet.textSync(this.packageInfo.name.toProperCase())} ${this.packageInfo.version}`);
        LOG.warn($$`StartingSystem`);

        LOG.warn($$`LoadingModules`);
        const loadAll = util.promisify(c => this.modulesLoader.once('loadAll', c))();
        this.modulesLoader.loadAllModules(modules);
        await loadAll; // first-run means we cannot await loadAllModules

        LOG.warn($$`StartingIntegrations`);
        await Promise.all(integrations.map(integration => this.modulesLoader.startIntegration(integration)));

        this.statusFlag = global.StatusFlag.Started;
        LOG.warn($$`SystemStarted` + ' ' + $$`HelloWorld`.rainbow);
        this.heartBeat = setInterval(() => console.debug('Core Heartbeat'), 2147483647);
        this.emitAsync('started');
    }

    /**
     * Shutdown Concierge.
     * @param {Symbol(string)} flag shutdown status. Defaults to `global.StatusFlag.Shutdown`.
     * @emits Platform#preshutdown
     * @emits Platform#shutdown
     * @see `global.StatusFlag`
     */
    async shutdown (flag) {
        if (this.statusFlag !== global.StatusFlag.Started) {
            throw new Error($$`ShutdownError`);
        }

        this.emit('preshutdown');

        // Unload user modules
        await this.config.saveConfig();
        await this.modulesLoader.unloadAllModules();
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
