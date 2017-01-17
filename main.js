#!/usr/bin/env node

/** Node.js server for a bot
 *
 * Herein lies the Node.js serverside script to tell node what to do to ensure
 * we get all the magical goodness that is:
 *         (Karma + Sassy) * Facebook - Hipchat = Concierge
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
 *        Copyright (c) Matthew Knox and Contributors 2016.
 */

'use strict';

// Load NodeJS Modifications/Variables
require('./core/startup/extensions.js')(__dirname);

const startup = require('./core/startup/startup.js'),
    argp = require('./core/common/arguments.js');

// Parse optional arguments
const args = argp.parseArguments(process.argv.slice(2), argp.conciergeArguments, { enabled: true, string: 'node main.js', colours: true }, true);

// Check if help was run
if (args.parsed['-h']) {
    process.exit(0);
}

// Check startup modes
if (args.unassociated.length === 0) {
    console.info('No integrations specified, defaulting to \'test\'.');
    args.unassociated.push('test');
}

const startArgs = args.unassociated.map(arg => arg.toLowerCase());
startup.run(startArgs);
