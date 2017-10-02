/**
 * Handles the startup of Concierge.
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
 *        Copyright (c) Matthew Knox and Contributors 2017.
 */

'use strict';

const cp = require('child_process'),
    fork = cp.fork,
    path = require('path'),
    origSpawn = cp.ChildProcess.prototype.spawn;

cp.ChildProcess.prototype.spawn = function () {
    const args = Array.from(arguments);
    const arg0 = args[0];
    if (arg0 && arg0.envPairs) {
        const entries = arg0.envPairs.filter(i => i.startsWith('ELECTRON_RUN_AS_NODE'));
        for (let entry of entries) {
            const index = arg0.envPairs.indexOf(entry);
            arg0.envPairs.splice(index, 1);
        }
    }
    origSpawn.apply(this, args);
};

global.StatusFlag = {
    Unknown: 1,
    NotStarted: 2,
    Started: 3,
    ShutdownShouldRestart: 4,
    Shutdown: 0
};

class ConciergeProcess {
    constructor (args, rootPath) {
        this._exit = this._exit.bind(this);
        this._args = args;
        this._rootPath = rootPath;
        this._start();
    }

    _fixDebugArgs () {
        const currArgs = process.execArgv;
        for (let i = 0; i < currArgs.length; i++) {
            if (/\=[0-9]{4}$/.test(currArgs[i])) {
                const val = parseInt(currArgs[i].substr(currArgs[i].length - 4)) + 1;
                currArgs[i] = currArgs[i].substring(0, currArgs[i].length - 4) + val;
            }
        }
        return currArgs;
    }

    _start () {
        process.env.__concierge_fork = this._rootPath;
        this._process = fork(path.join(__dirname, 'startup.js'), this._args, {
            cwd: process.cwd(),
            env: process.env,
            execArgv: this._fixDebugArgs(),
            stdio: 'inherit'
        });
        this._process.on('exit', this._exit);
    }

    _criticalError (code, signal) {
        console.error(`!CORE! critical error was unhandled (${code}, ${signal}). Please report this to developers.`);
        process.exit(code);
    }

    _exit (code, signal) {
        if (!code && !signal) {
            code = 0;
        }
        switch (code) {
        case global.StatusFlag.Shutdown:
            process.exit(code);
        case global.StatusFlag.ShutdownShouldRestart:
            this._start();
            break;
        default:
            this._criticalError(code, signal || 'NONE');
        }
    }
}

const start = (direct, rootPath) => {
    require('./extensions.js')(rootPath, !!direct);
    return require('./exports.js');
};

exports.run = (cli, args, rootPath) => cli ? new ConciergeProcess(args, rootPath) : start(false, rootPath);

if (process.env.__concierge_fork) {
    try {
        const platform = start(true, process.env.__concierge_fork),
            cli = require('./cli.js')(process.argv.slice(2));
        return platform(cli);
    }
    catch (e) {
        delete e.rawStackTrace;
        console.error(e);
        process.exit(global.currentPlatform ? global.currentPlatform.statusFlag : global.StatusFlag.Unknown);
    }
}
