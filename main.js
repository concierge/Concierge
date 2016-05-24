/** Node.js server for a bot (Kassy)
 *
 * Herein lies the Node.js serverside script to tell node what to do to ensure
 * we get all the magical goodness that is:
 *         (Karma + Sassy) * Facebook - Hipchat = Kassy
 * Note: it does waaaaaaay more than this now. It even runs on slack!
 *
 * Written By:
 *         Matthew Knox
 *
 * Contributors:
 *         Dion Woolley
 *         Jay Harris
 *         Matt Hartstonge
 *         (Others, mainly strange people)
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2015.
 */

'use strict';

// Load NodeJS Modifications/Variables
require('./core/require.js');
require('./core/prototypes.js');
require('./core/status.js');
require('./core/unsafe/console.js');

var integf = require('./core/integrations/integrations.js'),
    startup = require('./core/startup.js'),
    integ = integf.listIntegrations(),
    argp = require('./core/arguments.js'),
    args = process.argv;

args.splice(0, 2);

// Parse optional arguments
argp.runArguments(args);

// Check startup modes
if (!args || args.length === 0) {
    console.info('No integrations specified, defaulting to \'test\'.');
    args.push('test');
}

// Check startup integrations
var startArgs = [];
for (var i = 0; i < args.length; i++) {
    args[i] = args[i].toLowerCase();
    var inte = integ.find(function(int) {
        return int.name === args[i];
    });
    if (!inte) {
        console.error('Unknown mode \'' + args[i] + '\'');
        console.info('The integrations avalible on your system are:');
        for (var i = 0; i < integ.length; i++) {
            console.info('\t- \'' + integ[i].name + '\'');
        }
        process.exit(-2);
    }
    else {
        startArgs.push(inte);
    }
}

process.on('uncaughtException', function(err) {
    if (console.isDebug()) {
        console.error('CRITICAL ERROR WAS UNHANDLED:');
    }
    else {
        console.error('An unhandled error occurred. Start as debug for details.');
    }
    console.critical(err);
});

integf.setIntegrations(startArgs);
startup.run();
