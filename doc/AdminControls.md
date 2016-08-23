# Admin Controls

The `/admin` [special command](SpecialCommands.md) provides the ability to control the usage of core modules.

This is done through the concept of permission names. One or more permission names are associated with a core module. Only if a user has been granted one of those permission names is it possible for them to use that core module. Configuring should typically occur before starting the bot, as the `/admin` command is only designed for fine tuning after startup.

Configuration takes the form of the `admin` section in the main `config.json` file in the following format:
```json
{
    "admin": {
        "modules": {
            "<coreModuleName1>": ["<permissionName1>", "<permissionName2>", ...],
			"<coreModuleName2>": ["<permissionName3>", "<permissionName1>", ...],
        },
        "users": {
            "<usersFullNameOrID>": {
                "<threadIdRegex>": ["<permissionName1>", "<permissionName2>"]
            },
			...
        }
    }
}
```

For example, if you had the users "foo" and "bar". "foo" should be able to shutdown and update, but "bar" should only be able to update. The following configuration would achieve that (there are many ways of acheiving the same goal):
```json
{
    "admin": {
        "modules": {
            "shutdown": ["canShutdown"],
			"update": ["canUpdate"]
        },
        "users": {
            "foo": {
                ".*": ["canShutdown", "canUpdate"]
            },
			"bar": {
                ".*": ["canUpdate"]
            }
        }
    }
}
```

**Notes**:
- Permissions can have any name
- If no permission is added to a core module, then everyone will have access
- Users without access to a module will not see help for that module and will not receive responses from it
- It is possible to lock out everyone from a core module. In the case that both `/shutdown` and `/restart` have no users that can access them - it is not possible to shutdown while safely saving module configuration.
