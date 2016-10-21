/**
 * Platform status flags.
 *
 * Written By:
 *         Matthew Knox
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Matthew Knox and Contributors 2015.
 */

global.StatusFlag = {
    NotStarted: Symbol('NotStarted'),
    Unknown: Symbol('Unknown'),
    Started: Symbol('Started'),
    Shutdown: Symbol('Shutdown'),
    ShutdownShouldRestart: Symbol('ShutdownShouldRestart')
};
