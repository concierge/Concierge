## Creating New Modules
### Quick Reference
- [Api Object](./api/Api.md)
- [Event Object](./api/Event.md)
- [`kassy.json`](./api/Kassy.json.md)
- [Module Methods](./api/Module.md)
- [Integration Methods](./api/Integration.md)
- [Service Methods](./api/Service.md)
- [Translations](./api/Translation.md)

### What is a Module?
A module is a piece of code that tells Concierge what to respond with after receiving messages from any chat platform. It is meant to only handle messages specified with the associated command.

For example, a module meant to respond with current time will only handle messages beginning with `/time` where `/` is the `commandPrefix` specifying messages for Concierge and `time` is the command, specifying messages for the module.

A module needs to tell Concierge three things:
- Associated command for the module
- A *help* message, to inform the user about what the module is for
- And the logic code that prepares the response for Concierge to send back.

### Module Formats
Concierge supports two primary module formats:
- Kassy (see below for details, recommended). This is the native module format for Concierge and is the most supported.
- Hubot. For details on how to create Hubot scripts, refer to the Hubot documentation [here](https://hubot.github.com/docs/scripting/).

### Kassy Module Format
For a "Hello World" example see [here](https://github.com/concierge/HelloConcierge).

The basic module for a Concierge module will be created as a new directory within the `modules` directory of Concierge (*not to be confused with `node_modules`*).
It will contain the following files:
- `someModule.js` - an ES6, strict mode JavaScript file that will be the basis of the module. [See here](./api/Module.md) for the methods that this should implement.
- `kassy.json` - a file describing your module, that can be used by Concierge to start it. [See here](./api/Kassy.json.md) for the properties that should be in this file.

#### Dependencies
Concierge has been created using [Node.JS](https://nodejs.org/). As with any Node.JS application, it is possible to depend on other Node.JS modules using `require`. Within Concierge, `require` has been extended to automatically install modules from [NPM](https://www.npmjs.com/) if they are not found locally.
For example, if you inserted the statement `require('foo')` into a module and `foo` was an NPM module that had not already been installed, `foo` would be installed before letting your module continue execution.

### Methods
Every module must provide the some basic methods depending on their type. These are used to perform whatever tasks are required. The basic types are:
- [Module](./api/Module.md). A module listens for and responds to messages from users.
- [Integration](./api/Integration.md). An integration links Concerige into a chat platform (such as Facebook). Also see [Integration Creation](./IntegrationCreation.md).
- [Service](./api/Service.md). A service is for long running tasks. This might involve middleware or hosting a webserver.

### `kassy.json`
Every module must have a `kassy.json` file containing some basic information about the module. The properties required can be found [here](./api/Kassy.json.md).

### Persistence
Any data stored in `exports.config` within the scope of a module will automatically be persistent between restarts of the program, provided a safe shutdown and an error free startup. Note that data in this variable is not guaranteed to be set before `load()` is called on your module. See [Module.md#config](./api/Module.md#config) for more information.

### Logging and Errors
Any logging and errors should **NOT** be logged to the console using any methods other than:
- `console.debug(str)` - logs `str` to the console if and only if debugging is enabled.
- `console.critical(exception)`- logs the message and trace of an Exception (`exception`) to the console if and only if debugging is enabled.

This is to prevent spamming users with information that is not relevant.

### Loading Modules
New modules will be automatically detected and loaded after a restart of the application. Aside from a normal restart of the application this task can also be achieved using the following commands if the appropriate modules are installed:
- `/kpm reload <moduleName>` from the `kpm` module. This reloads the module without restarting.
- `/restart` from the `restart` module. This restarts Concierge, reloading the module in the process.

Please note that the `/update` command from the `update` module only updates Concierge, not the modules installed within it.
