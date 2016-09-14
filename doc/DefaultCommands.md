## Default Commands
On the first install of Concierge, the following modules are installed (if `git` is in the path, otherwise they must be manually installed):
- `creator` - Displays information about the creators of Concierge
- `help` - Displays module help.
- `kpm` - Package Manager, assists with the installing and managing of packages.
- `ping` - Displays information
- `restart` - Restarts Concierge, performing a hotswap of code in the process.
- `shutdown` - Performs a safe shutdown of Concierge. Equivalent to a CTRL-C.
- `update` - Updates Concierge.

Additional modules can be installed into the modules directory. Named modules on KPM [can be found here](https://github.com/concierge/Concierge/wiki/KPM-Table).

It is possible to force the installation of the default modules on the next launch of Concierge by deleting the `firstRun` section from the main `config.json`.
