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

var figlet = require('figlet');

var Platform = function(integrations) {
    this.config = require.once('./config.js');
    this.integrationManager = require.once('./integrations/integrations.js');
    this.integrationManager.setIntegrations(integrations);
    this.defaultPrefix = '/';
    this.packageInfo = require.once('../package.json');
    this.modulesLoader = require.once('./modules/modules.js');
    this.statusFlag = StatusFlag.NotStarted;
    this.onShutdown = null;
    this.waitingTime = 250;
    this.packageInfo.name = this.packageInfo.name.toProperCase();
};

Platform.prototype._handleTransaction = function(module, args) {
    var returnVal = true,
        timeout = setTimeout(function() {
            if (returnVal !== true) {
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
};

Platform.prototype.onMessage = function(api, event) {
    var matchArgs = [event, api.commandPrefix],
        runArgs = [api, event],
        loadedModules = this.modulesLoader.getLoadedModules();

    event.module_match_count = 0;
    for (var i = 0; i < loadedModules.length; i++) {
        var matchResult;
        try {
            matchResult = loadedModules[i].match.apply(loadedModules[i], matchArgs);
        }
        catch (e) {
            console.error(i18n`The module ${loadedModules[i].name} appears to be broken. Please remove or fix it.`);
            console.critical(e);
            continue;
        }

        if (matchResult) {
            event.module_match_count++;
            var transactionRes = this._handleTransaction(loadedModules[i], runArgs);

            if (event.shouldAbort || transactionRes) {
                return;
            }
        }
    }
};

Platform.prototype.getIntegrationApis = function() {
    var integs = this.integrationManager.getSetIntegrations();
    var apis = {};
    for (var key in integs) {
        if (!integs.hasOwnProperty(key)) {
            continue;
        }
        apis[key] = integs[key].getApi();
    }
    return apis;
};

Platform.prototype.start = function() {
    if (this.statusFlag !== StatusFlag.NotStarted) {
        throw $$`StartError`;
    }

    console.title(figlet.textSync(this.packageInfo.name.toProperCase()));

    console.title(' ' + this.packageInfo.version);
    console.info('------------------------------------');
    console.warn($$`StartingSystem`);

    console.warn($$`LoadingSystemConfig`);
    this.integrationManager.setIntegrationConfigs(this);

    // Load Kassy modules
    console.warn($$`LoadingModules`);
    this.modulesLoader.loadAllModules(this);

    // Starting output
    console.warn($$`StartingIntegrations`);
    this.integrationManager.startIntegrations(this.onMessage.bind(this));

    this.statusFlag = StatusFlag.Started;
    console.warn($$`SystemStarted` + ' ' + $$`HelloWorld`.rainbow);
};

Platform.prototype.shutdown = function(flag) {
    if (this.statusFlag !== StatusFlag.Started) {
        throw 'Cannot shutdown platform when it is not started.';
    }
    if (!flag) {
        flag = 0;
    }

    // Stop output integrations
    this.integrationManager.stopIntegrations();

    // Unload user modules
    this.modulesLoader.unloadAllModules(this.config);

    this.config.saveSystemConfig();
    this.statusFlag = flag ? flag : StatusFlag.Shutdown;

    console.warn(this.packageInfo.name + ' has shutdown.');
    if (this.onShutdown && this.onShutdown != null) {
        this.onShutdown(this.statusFlag);
    }
};

Platform.prototype.setOnShutdown = function(onShutdown) {
    this.onShutdown = onShutdown;
};

module.exports = Platform;
