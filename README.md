# Kassy
(Karma + Sassy) * (Facebook + Slack + Skype + Hipchat) = Kassy

<i>It does way more than this now...</i>

Kassy is a modular, easily extensible general purpose chat bot. Small node.js modules can be written for it then placed in the modules directory. They will load on startup (or restart) and become part of what the chat bot provides. Current pre-installed modules are located [here](https://github.com/mrkno/Kassy/tree/master/modules). They include a variety of functionality from getting animated gifs to running arbitrary sandboxed JavaScript code, voting and giving karma.

## Usage
First clone the repository and install required npm packages:
```
git clone https://github.com/mrkno/Kassy.git
cd Kassy
npm install
```

### Modes
#### Facebook Integration
Create a new file, `config.json` that has the following:
```
{
	"output": {
		"facebook": {
			"username": "<facebookEmail>",
			"password": "<facebookPassword>",
			"testingName": "<testingName>",
			"commandPrefix": "/"
		}
	}
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets.

To start in Facebook mode, run `node main.js facebook`.

#### Slack Integration
Create a new file, `config.json` that has the following:
```
{
    "output": {
        "slack": {
            "name": "Kassy",
            "slack_tokens": [
                <yourSlackTeamToken>
                ....
            ],
            "port": "<portNumber>",
            "commandPrefix": "!"
        }
    }
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets and update your slack team configuration to match.

Slack integration supports multiple teams at once simply add your teams slack bot token to config.json and start Kassy

Tokens can be issued from here https://api.slack.com/web

To start in slack mode, run `node main.js slack`.

#### Skype Integration
Create a new file, `config.json` that has the following:
```
{
	"output": {
		"skype": {
			"username": "<skypeUsername/skypeEmail>",
			"password": "<skypePassword>",
			"commandPrefix": "!",
			"conversations": ["<conversationID1>","<conversationID2",...]
		}
	}
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets.

<i>Note: the conversations option is optional and if it is not included all conversations will be listened to.</i>

To start in skype mode, run `node main.js skype`.

<b>Please note: the account that Kassy is logged in as will not see the messages it sends.</b>

#### Testing Mode

Testing mode requires no configuration. It provides a testing ground to experiment with your modules before using them live in one of the service integrations.

To start in testing mode, run `node main.js` or `node main.js test`.

Additional special commands exist in testing mode that are not in any other mode:

- `/setuser <userName>` - changes your username.

### Special Commands
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

### Debugging CLI Options
There are two debugging related command line options that can be passed to Kassy. These must occur first and if both are used, be in the correct order for them to work.
- `debug`. Turns on verbose logging for Kassy. Useful for finding exact cause of an issue.
- `log`. Enables logging to a `kassy.log` file in the root of the project.

### Kassy Package Manager
Run `/kpm help [command]` for help with KPM. Also refer to the hello world example [here](https://github.com/mrkno/HelloKassy).

## Creating New Modules
### General Nodes
For a "Hello World" example see [here](https://github.com/mrkno/HelloKassy). 

#### File Locations

- Modules should be created as their folder within the `modules` (<b>not `node_modules`</b>) subdirectory.
- Each module folder should contain a `kassy.json` file (see existing modules for examples).

#### `require('module')`
Any modules that depend on an `npm` package should include it using:
```
var module = require.safe('module');
```
instead of:
```
var module = require('module');
```

This is so that `package.json` does not need to be updated for every module and to allow for seamless updating using the built in updater.

### Methods

Every module must provide the same basic methods, which can then be expanded to perform whatever tasks are required. These are as follows:

#### `exports.match(messageText, messageThread, senderName)`
This method is used to test whether your module should be run on the given message.

Arguments:
- `messageText`. The text of the message that has been received. String.
- `messageThread`. A handle to the thread the message was received on. String.
- `senderName`. The name of the sender. String.
- <i>returns</i>. `true` if the module should run, `false` otherwise. Boolean.

For example, if you were creating a weather module that runs whenever the text `/weather` is written, `match` would return `true` if text was `/weather some data here` and `false` if it was `not what you are wanting`.

#### `exports.help()`
This method should return an array of arrays containing help to be used with the `/kassy` command.

Each sub-array should contain:
- 1st Index: the command help is being provided for as a string. E.g. '/example'.
- 2nd Index: a short description of what the command does as a string. E.g. 'Is an example command.'.
- 3rd Index: (optional) a long description of what the command does as a string. E.g. 'Is an example command that can be used to do foo.'.

Arguments:
- <i>returns</i>. An array of arrays containing help. Array.

For example, with a weather module you might return `'Gets the weather of your current location.'`.

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

### Event
The `event` object contains the following fields:
- `body`. The body of the message received. String.
- `thread_id`. The ID of the thread the message was received from. String.
- `sender_name`. The name of the sender that the message was received from. String.
- `sender_id`. The ID of the sender who sent the message. String.

### Persistence
Any data stored in `this.config` or `exports.config` within the scope of a module will automatically be persistent between restarts of the program, provided a safe shutdown and an error free startup.

### Logging and Errors
Any logging and errors should <b>NOT</b> be logged to the console using any methods other than:
- `console.debug(str)` - logs `str` to the console if and only if debugging is enabled.
- `console.critical(exception)`- logs the message and trace of an Exception (`exception`) to the console if and only if debugging is enabled.

This is to prevent spamming users with information that is not relevant.

### Loading Modules
New modules will be automatically detected and loaded after a restart of the application. This can be performed using the special `/restart` command.

Kassy can also be updated, pulling new pre-installed modules down with it. This can be performed using a combination of the `/update` and `/restart` commands.

## Disclaimer
HERE BE DRAGONS!
Written to see if it could be done, not written to be readable.<br><b>Enter at your own peril.</b>

## Contributions
Contributions welcome.

## Copyright and License
Licensed under the MIT license. Unless otherwise specified, code is Copyright (c) Matthew Knox 2015.
