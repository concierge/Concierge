## Creating New Modules
### General Nodes
For a "Hello World" example see [here](https://github.com/mrkno/HelloKassy).

The basic module for a Kassy module will contain the following files:
- `someModule.js` - a javascript file that will be the basis of the module.
- `kassy.json` - a file describing your module, that can be used by Kassy to start it.

Correctly created modules once in a public git repository can automatically be installed using the `kpm` command.

#### File Locations

- Modules should be created as their folder within the `modules` (<b>not `node_modules`</b>) subdirectory.
- Each module folder should contain a `kassy.json` file (see existing modules for examples).

#### `require('module')`
Any modules that depend on an `npm` package should include it as usual using the `require` function. Note: if the package that has been required is not installed, the latest version will be installed for you.

Additional methods are also avalible with require:

* ~~require.safe('module')~~ __Deprecated__ available for backwards compatibility.
* ~~require.once('module')~~ __Internal__ required to allow seemless code hotswap.

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

### API
<i>Please note that not all methods are guaranteed to work as described if the platform does not support the feature. A fallback will be provided in this case.</i>

The `api` object contains the following methods:
#### `sendMessage(message, thread)`
Sends a message to the specified thread.

Arguments:
- `message`. The message to send. String.
- `thread`. The thread to send it to. String.

Returns:
- `undefined`

#### `sendPrivateMessage(message, thread, senderId)`
Sends a message to an individual.

Arguments:
- `message`. The message to send. String.
- `thread`. The thread which the associated command which sends the private message. String.
- `senderId`. The sender to send the message to. String.

Returns:
- `undefined`

#### `sendUrl(url, thread)`
Sends a url to the specified thread. If url linking is not supported, will behave like `sendMessage`.

Arguments:
- `url`. The url to send. String.
- `thread`. The thread to send it to. String.

Returns:
- `undefined`

#### `sendImage(type, image, description, thread)`
Sends an image to the specified thread. If image is a URL it will behave like `sendUrl`, otherwise it will behave like `sendFile`.

Arguments:
- `type`. The type of image being sent. `"url"` for a URL to an image or `"file"` for a local file. String.
- `image`. The image to send. String (url or file location). String.
- `description`. The description to associate with the image. String
- `thread`. The thread to send it to. String.

Returns:
- `undefined`

#### `sendFile(type, file, description, thread)`
Sends a file to the specified thread. If file is a URL it will behave like `sendUrl`, otherwise it will send directly.

Arguments:
- `type`. The type of file being sent. `"url"` for a URL to a file or `"file"` for a local file. String.
- `file`. The file to send. String (url or file location). String.
- `description`. The description to associate with the file. String
- `thread`. The thread to send it to. String.

Returns:
- `undefined`

#### `sendTyping(thread)`
Sends a typing indicator to the specified thread. Will either time out or cancel when the next call to `api` occurs.

Arguments:
- `thread`. The thread to send it to. String.

Returns:
- `undefined`

#### `setTitle(title, thread)`
Sets the title of the specified thread.

Arguments:
- `title`. The title to set. String.
- `thread`. The thread to set it on. String.

Returns:
- `undefined`

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


### Event
The `event` object contains the following fields:
- `body`. The body of the message received. String.
- `arguments`. `body` split at spaces except where the spaces are inside double quotes. Array of Strings.
- `arguments_body`. `body` with the command removed from the beginning. String.
- `thread_id`. The ID of the thread the message was received from. String.
- `sender_name`. The name of the sender that the message was received from. String.
- `sender_id`. The ID of the sender who sent the message. String.

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

### Special Commands
Please note that special commands cannot be overriden by any other command.

### Core Modules
Within Kassy there is the concept of "Core" modules. These are modules that provide core functionality of Kassy. If possible creating these should be avoided as any incorrect code within them can cause total system failure (traditional modules have additional protections). Further they have the ability to access and alter core components of the system that should not ever be required in a traditional module.

Core modules are located in `core/core_modules`. Use existing modules as documentation on how they work - it is subject to frequent change.
