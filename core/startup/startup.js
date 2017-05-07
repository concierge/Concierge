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

const fork = require('child_process').fork,
    path = require('path');

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
        console.error(e);
        process.exit(global.currentPlatform ? global.currentPlatform.statusFlag : global.StatusFlag.Unknown);
    }
}
