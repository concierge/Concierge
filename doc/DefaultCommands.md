## Default Commands
On the first install of Concierge, the following modules are installed (if `git` is in the path, otherwise they must be manually installed):
- `boss` - A web-based admin control panel for Concierge.
- `creator` - Displays information about the creators of Concierge
- `help` - Displays module help.
- `kpm` - Package Manager, assists with the installing and managing of packages.
- `ping` - Displays information
- `restart` - Restarts Concierge, performing a hotswap of code in the process.
- `shutdown` - Performs a safe shutdown of Concierge. Equivalent to a CTRL-C.
- `update` - Updates Concierge.

Additional modules can be installed into the modules directory. Named modules on KPM [can be found here](https://github.com/concierge/Concierge/wiki/KPM-Table).

It is possible to force the installation of the default modules on the next launch of Concierge by deleting the `firstRun` section from the main `config.json`.

### Custom Defaults
Custom defaults can be specified by creating the file `defaults.json` in the Concierge root directory. This file should have the following format (git URL, name):
```json
[
    ["https://github.com/concierge/creator.git", "creator"],
    ["https://github.com/concierge/help.git", "help"],
    ["https://github.com/concierge/kpm.git", "kpm"],
    ["https://github.com/concierge/ping.git", "ping"],
    ["https://github.com/concierge/restart.git", "restart"],
    ["https://github.com/concierge/shutdown.git", "shutdown"],
    ["https://github.com/concierge/update.git", "update"],
    ["https://github.com/concierge/test.git", "test"]
]
```
