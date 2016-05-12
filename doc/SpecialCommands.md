## Special Commands
There are a number of special commands that will not be listed by help and cannot be overridden by custom modules.
- `/help` and `/kassy`. Shows the available module commands.
- `/shutdown`. Terminates the program gracefully.
- `/restart`. Restarts the program, reloading and searching for new modules. Useful if you have made changes to an existing module or have created a new module.
- `/disable`. Toggles ignoring of commands - will not ignore special commands.
- `/update`. Performs a git-pull on the repository this is contained within.
- `/ping`. Responds with version and hostname of machine running the program.
- `/uptime`. Shows uptime information for Kassy.
- `/creator`. Prints information about the creators of Kassy.
- `/kpm`. Package manager for Kassy.
- `/issue <title> <debugLevel>`. Posts an issue to github.
- `/issue <title> <description> <debugLevel>`. Posts an issue to github with a description.
    * debugLevel, can be basic, detail or full, defaults to basic if not specified

## Kassy Package Manager (KPM)
Run `/kpm help [command]` for help with KPM. Also refer to the hello world example [here](https://github.com/mrkno/HelloKassy).

KPM currently provides a number of commands:
- `/kpm help`. Shows help for each command KPM provides.
- `/kpm help [command]`. Filters the previous command.
- `/kpm install [module(s)]`. Installs one or more modules from exising git repositories, github references or the [KPM lookup table](https://github.com/mrkno/Kassy/wiki/KPM-Table).
- `/kpm uninstall [moduleName(s)]`. Uninstalls one or more modules.
- `/kpm update`. Updates all modules.
- `/kpm update [module(s)]`. Updates specific modules.
- `/kpm list`. Lists all KPM installed modules.