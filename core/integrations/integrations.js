/**
    * Provides helper functions for handling output integrations.
    *
    * Written By:
    *              Matthew Knox
    *
    * License:
    *              MIT License. All code unless otherwise specified is
    *              Copyright (c) Matthew Knox and Contributors 2015.
    */

var files                   = require.once('../files.js'),
    fs                      = require('fs'),
    path                    = require('path'),
    integrationsLocation    = 'core/core_integrations',
    cachedIntegrations      = null,
    selectedIntegrations    = null,
    started                 = false;

global.shim = require.once('../shim.js');

exports.listIntegrations = function () {
    if (cachedIntegrations) {
        return cachedIntegrations;
    }
    var integ = files.filesInDirectory('./' + integrationsLocation),
        list = [];
    for (var i = 0; i < integ.length; i++) {
        var p = path.join(__dirname, '../../' + integrationsLocation, integ[i]);
        if (path.extname(integ[i]) !== '') {
            list.push({
                name: path.basename(integ[i], path.extname(integ[i])).toLowerCase(),
                start: p
            });
        } else {
            try {
                var stat = fs.statSync(p);
                if (!stat.isDirectory()) {
                    throw 'Integration must be .js file or directory.';
                }

                var desc = require(path.join(p, 'package.json'));
                if (!desc.name || !desc.main) {
                    throw 'Not enough information provided to describe integration.';
                }

                list.push({
                    name: desc.name.replace(/ /g, '-').toLowerCase(),
                    start: path.join(p, desc.main)
                });
            } catch (e) {
                console.error('Invalid integration installed (syntax error?).');
                console.critical(e);
            }
        }
    }
    cachedIntegrations = list;
    return list;
};

exports.setIntegrationConfigs = function (platform) {
    shim.current = platform;
    for (var i = 0; i < selectedIntegrations.length; i++) {
        selectedIntegrations[i].instance.platform = platform;
        selectedIntegrations[i].instance.config = platform.config.loadOutputConfig(selectedIntegrations[i].name);

        for (var name in selectedIntegrations[i].instance.config) {
            if (name.startsWith('ENV_') && name === name.toUpperCase()) {
                process.env[name.substr(4)] = selectedIntegrations[i].instance.config[name];
            }
        }

        if (!selectedIntegrations[i].instance.config.commandPrefix) {
            selectedIntegrations[i].instance.config.commandPrefix = platform.defaultPrefix;
        }
    }
};

exports.setIntegrations = function (integrations) {
    if (selectedIntegrations) {
        throw 'Cannot change integrations when they are already set.';
    }

    var i = 0;
    try {
        for (i = 0; i < integrations.length; i++) {
            if (!global.coffeescriptLoaded && integrations[i].start.endsWith('.coffee')) {
                require('coffee-script').register();
                global.coffeescriptLoaded = true;
            }
            integrations[i].instance = require.once(integrations[i].start);

            if (integrations[i].instance.use) {
                integrations[i].instance = require.once('./hubot/robot.js').use(integrations[i].instance);
            }
        }
        selectedIntegrations = integrations;
        selectedIntegrations.push({
            name: 'loopback',
            instance: require.once('./loopback.js')
        });

        return true;
    }
    catch (e) {
        console.critical(e);
        console.error('Loading the output integration file \'' + integrations[i] + '\' failed.' +
            '\n\nIf this is your file please ensure that it is syntactically correct.');
        return false;
    }
};

exports.startIntegrations = function (callback) {
    if (!selectedIntegrations || selectedIntegrations.length === 0) {
        throw 'Integrations must be set before starting';
    }

    if (started) {
        throw 'Cannot start when already started.';
    }

    for (var i = 0; i < selectedIntegrations.length; i++) {
        try {
            var integ = selectedIntegrations[i];
            console.write('Loading integration \'' + integ.name + '\'...\t');
            integ.instance.start(function () {
                arguments[1].event_source = integ.name;
                callback.apply(this, arguments);
            });
            console.info('[DONE]');
        }
        catch (e) {
            console.error('[FAIL]');
            console.debug('Failed to start output integration \'' + selectedIntegrations[i].name + '\'.');
            console.critical(e);
        }
    }
    
    started = true;
};

exports.stopIntegrations = function() {
    if (!started) {
        throw 'Cannot stop integrations if they haven\'t been started.';
    }

    for (var i = 0; i < selectedIntegrations.length; i++) {
        try {
            console.write('Stopping integration \'' + selectedIntegrations[i].name + '\'...\t');
            selectedIntegrations[i].instance.stop();
            console.info('[DONE]');
        }
        catch (e) {
            console.error('[FAIL]');
            console.debug('Failed to correctly stop output integration \'' + selectedIntegrations[i].name + '\'.');
            console.critical(e);
        }
    }

    started = false;
    shim.current = null;
    shim = null;
};

exports.getSetIntegrations = function() {
	if (!selectedIntegrations) {
	    throw 'Cannot get integrations if they have not already been set.';
	}
	var integs = {};
	for (var i = 0; i < selectedIntegrations.length; i++) {
	    integs[selectedIntegrations[i].name] = selectedIntegrations[i].instance;
	}
    return integs;
};
