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

const startup = require('./core/startup/startup.js'),
    direct = require.main === module;

module.exports = startup.run(direct, process.argv.slice(2), __dirname);
