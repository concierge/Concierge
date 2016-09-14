## Creating New Modules
### Module Formats
Concierge supports two primary module formats:
- Kassy (see below for details, recommended). This is the native module format for Concierge and is the most supported.
- Hubot. For details on how to create Hubot scripts, refer to the Hubot documentation [here](https://hubot.github.com/docs/scripting/).

### Kassy Module Format
For a "Hello World" example see [here](https://github.com/concierge/HelloConcierge).

The basic module for a Concierge module will created as a new directory within the `modules` directory of Concierge (*not to be confused with `node_modules`</b>*).
It will contain the following files:
- `someModule.js` - an ES6, strict mode JavaScript file that will be the basis of the module. See [here]() for the methods that this should implement.
- `kassy.json` - a file describing your module, that can be used by Concierge to start it. See [here]() for the properties that should be in this file.

#### Dependencies
Concierge has been created using [Node.JS](https://nodejs.org/). As with any Node.JS application, it is possible to depend on other Node.JS modules using `require`. Within Concierge, `require` has been extended to automatically install any dependency it does not have/cannot find from [NPM](https://www.npmjs.com/).
For example, if you inserted the statement `require('foo')` into a module and `foo` was an NPM module that had not already been installed, `foo` would be installed before letting your module continue execution.

Additional methods are also avalible with require:
* ~~require.safe('module')~~ __Deprecated__ available for backwards compatibility and when require has been overridden by another npm module.
* ~~require.once('module')~~ __Internal__ used internally to allow seemless code hotswap. You should use this whenever you require another `.js` file that you have created (not from NPM) within your module.

### Methods

Every module must provide the same basic methods, which can then be expanded to perform whatever tasks are required. These are as follows:

#### `exports.match(event, commandPrefix)`
<i>Optional if implemented in `kassy.json`, see below.</i>
This method is used to test whether your module should be run on the given message.

Arguments:
- `event`. The event representing the data that has been received See the Event section below. Object.
- `commandPrefix`. The command prefix of the integration that received the message. String.
- <i>returns</i>. `true` if the module should run, `false` otherwise. Boolean.

For example, if you were creating a weather module that runs whenever the text `/weather` is written, `match` would return `true` if `event.body` was `/weather some data here` and `false` if it was `not what you are wanting`.

<i>Note:

For backwards compatibility reasons, if the `event` argument is renamed to `text`, `event.body` will be passed rather than the `event` object.</i>


#### `exports.help(commandPrefix)`
<i>Optional if implemented in `kassy.json`, see below.</i>
This method should return an array of arrays containing help to be used with the `/kassy` command.

Each sub-array should contain:
- 1st Index: the command help is being provided for as a string. E.g. '/example'.
- 2nd Index: a short description of what the command does as a string. E.g. 'Is an example command.'.
- 3rd Index: (optional) a long description of what the command does as a string. E.g. 'Is an example command that can be used to do foo.'.

Arguments:
- 'commandPrefix'. The command prefix of the integration that received the message. String.
- <i>returns</i>. An array of arrays containing help. Array.

~~this.commandPrefix~~ __Deprecated__ available for backwards compatibility.

For example, with a weather module you might return `[[commandPrefix + 'weather', 'Gets the weather of your current location.']]`.

#### `exports.run(api, event)`
This method is called whenever the module should be run.

Arguments:
- `api`. The API to output data to the current output module. See API section below. Object.
- `event`. An object containing information about the message received. See event section below. Object.

For example, with a weather module you might call `api.sendMessage('The weather is nice here today!', event.thread_id);`.

#### `exports.unload()`
<i><b>Almost</b>-Optional</i>.
This method is called once when the program is shutting down. No output module is guaranteed to be available at this point. Should be used to unload files and cancel any timers. Failure to use this method correctly can prevent a successful restart.

Arguments:<br />
<i>None</i>

#### `exports.load()`
<i>Optional</i>.
This method is called once when the program is first starting up. No output module is guaranteed to be running at this point. Should be used to initialise variables or load files, etc as appropriate.

Arguments:<br />
<i>None</i>



#### `commandPrefix`
Is a static variable containing the command prefix that should be used for the platform.

### `kassy.json`
`kassy.json` is a file of the following format:
```
{
    "name": "<yourModuleNameHere>",
    "version": 1.0,
    "startup": "<yourModuleJSFileHere.js>",
    "command": "<(optional) someCommandHere>",
    "help": [
        ["{{commandPrefix}}<whateverCommandYouProvide>", "<some brief help>", "<(optional) some longer help>"]
    ]
}
```

Notes:
- Both the `command` and `help` sections are optional and can be used instead of their equivilent code methods.
- The `command` section is equivilent to doing a basic command check in `exports.match`
- The `help` section is equivilent to returning a constant array in `exports.help`


### Persistence
Any data stored in `exports.config` within the scope of a module will automatically be persistent between restarts of the program, provided a safe shutdown and an error free startup. Note that data in this variable is not gaurenteed to be set before `load()` is called on your module.

### Logging and Errors
Any logging and errors should <b>NOT</b> be logged to the console using any methods other than:
- `console.debug(str)` - logs `str` to the console if and only if debugging is enabled.
- `console.critical(exception)`- logs the message and trace of an Exception (`exception`) to the console if and only if debugging is enabled.

This is to prevent spamming users with information that is not relevant.

### Loading Modules
New modules will be automatically detected and loaded after a restart of the application. This can be performed using the special `/restart` command.

Kassy can also be updated, pulling new pre-installed modules down with it. This can be performed using a combination of the `/update` and `/restart` commands.
