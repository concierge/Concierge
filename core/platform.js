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

Platform = function() {
    require.reload('./prototypes.js');

    this.config = require('./config.js');
    this.loadedModules = [];
    this.coreModules = [];
    this.integrationManager = require('./integrations/integrations.js');
    this.defaultPrefix = '/';
    this.packageInfo = require.once('../package.json');
    this.modulesLoader = require.once('./modules/modules.js');
    this.coreLoader = require.once('./modules/core.js');
    this.coreLoader.platform = this;
    this.statusFlag = StatusFlag.NotStarted;
    this.onShutdown = null;
    this.waitingTime = 250;
    this.packageInfo.name = this.packageInfo.name.toProperCase();
};

Platform.prototype.handleTransaction = function(module, args) {
    var returnVal = true,
        timeout = setTimeout(function() {
            if (returnVal !== true) {
                return;
            }
            args[0].sendTyping(args[1].thread_id);
        }, this.waitingTime);
    returnVal = module.run.apply(module, args);
    clearTimeout(timeout);
};

Platform.prototype.messageRxd = function(api, event) {
    var matchArgs = [event, api.commandPrefix],
        runArgs = [api, event],
        abort = false;

    // Run core modules in platform mode
    for (var i = 0; i < this.coreModules.length; i++) {
        if (this.coreModules[i].match.apply(this, matchArgs)) {
            var temp = !this.coreModules[i].run.apply(this, runArgs);
            abort = abort || temp;
        }
    }
    if (abort) {
        return;
    }

    // Run user modules in protected mode
    for (var i = 0; i < this.loadedModules.length; i++) {
        var matchResult;
        try {
            matchResult = this.loadedModules[i].match.apply(this.loadedModules[i], matchArgs);
        }
        catch (e) {
            console.error('The module ' + this.loadedModules[i].name + ' appears to be broken. Please remove or fix it.');
            console.critical(e);
            continue;
        }

        if (matchResult) {
            try {
                this.handleTransaction(this.loadedModules[i], runArgs);
            }
            catch (e) {
                api.sendMessage(event.body + ' fucked up. Damn you ' + event.sender_name + ".", event.thread_id);
                console.critical(e);
            }
            return;
        }
    }
};


Platform.prototype.start = function() {
    if (this.statusFlag !== StatusFlag.NotStarted) {
        throw 'Cannot start platform when it is already started.';
    }

    console.title(figlet.textSync(this.packageInfo.name.toProperCase()));

    console.title(' ' + this.packageInfo.version);
    console.info('------------------------------------');
    console.warn('Starting system...\n'
                + 'Loading system configuration...');

    this.modulesLoader.disabledConfig = this.config.loadDisabledConfig();
    this.integrationManager.setIntegrationConfigs(this);

    // Load core modules
    console.warn('Loading core components...');
    var m = this.coreLoader.listCoreModules();
    for (var i = 0; i < m.length; i++) {
        this.coreModules.push(this.coreLoader.loadCoreModule(this, m[i]));
    }
    this.coreLoader.loadingComplete(this.coreModules);

    // Load Kassy modules
    console.warn('Loading modules...');
    m = this.modulesLoader.listModules();
    for (var mod in m) {
        var ld = this.modulesLoader.loadModule(m[mod]);
        if (ld && ld !== null) {
            this.loadedModules.push(ld);
        }
    }

    // Starting output
    console.warn('Starting integrations...');
    this.integrationManager.startIntegrations(this.messageRxd.bind(this));

    this.statusFlag = StatusFlag.Started;
    console.warn('System has started. ' + 'Hello World!'.rainbow);
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
    while (this.loadedModules.length > 0) {
        this.modulesLoader.unloadModule(this.loadedModules[0]);
        this.loadedModules.splice(0, 1);
    }

    // Unload core modules
    while (this.coreModules.length > 0) {
        this.coreLoader.unloadCoreModule(this.coreModules[0]);
        this.coreModules.splice(0, 1);
    }

    this.config.saveSystemConfig();
    this.statusFlag = flag ? flag : StatusFlag.Shutdown;

    console.warn(this.packageInfo.name + " has shutdown.");
    if (this.onShutdown && this.onShutdown != null) {
        this.onShutdown(this.statusFlag);
    }
};

Platform.prototype.setOnShutdown = function(onShutdown) {
    this.onShutdown = onShutdown;
};

module.exports = Platform;
