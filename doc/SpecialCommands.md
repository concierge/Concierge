## Special Commands
There are a number of special commands that will not be listed by help and cannot be overridden by custom modules.
- `/help` and `/concierge`. Shows the available module commands.
- `/shutdown`. Terminates the program gracefully.
- `/restart`. Restarts the program, reloading and searching for new modules. Useful if you have made changes to an existing module or have created a new module.
- `/disable`. Toggles ignoring of commands - will not ignore special commands.
- `/update`. Performs a git-pull on the repository this is contained within.
- `/ping`. Responds with version and hostname of machine running the program.
- `/creator`. Prints information about the creators.
- `/kpm`. Package manager (similar to `apt-get`).
- `/issue <title> <debugLevel>`. Posts an issue to github.
- `/issue <title> <description> <debugLevel>`. Posts an issue to github with a description.
    * debugLevel, can be basic, detail or full, defaults to basic if not specified
- `/admin <grant/revoke> "<fullNameOfUser>" "<permissionName>"`. Grants or revokes a permission for a user. See [here](AdminControls.md) for more information.
- `/admin <create/delete> "<coreModuleName>" "<permissionName>". Creates or deletes a permission for a core module. See [here](AdminControls.md) for more information.

Use `/help <commandName>` for more detail.

## Package Manager (KPM)
Run `/kpm help [command]` for help with KPM. Also refer to the hello world example [here](https://github.com/concierge/HelloKassy).

KPM currently provides a number of commands:
- `/kpm help`. Shows help for each command KPM provides.
- `/kpm help [command]`. Filters the previous command.
- `/kpm install [module(s)]`. Installs one or more modules from exising git repositories, github references or the [KPM lookup table](https://github.com/concierge/Concierge/wiki/KPM-Table).
- `/kpm uninstall [moduleName(s)]`. Uninstalls one or more modules.
- `/kpm update`. Updates all modules.
- `/kpm update [module(s)]`. Updates specific modules.
- `/kpm list`. Lists all KPM installed modules.
