# Kassy
(Karma + Sassy) * (Facebook + Slack) - Hipchat = Kassy

<i>It does way more than this now...</i>

Kassy is a modular, easily extensible general purpose chat bot. Small node.js modules can be written for it then placed in the modules directory. They will load on startup (or restart) and become part of what the chat bot provides. Current pre-installed modules are located [here](https://github.com/mrkno/Kassy/tree/master/modules). They include a variety of functionality from getting animated gifs to running arbitrary sandboxed javascript code, voting and giving karma.

## Usage
First clone the repository and install required npm packages:
```
git clone https://github.com/mrkno/Kassy.git
cd Kassy
npm install
```
<i>As of November 2015 `npm install` fails due to an error compiling the required dependency `require-install`. As this is the last dependency to install it is safe to install it manually into the `node_modules` directory after running the command.</i>

### Modes
#### Facebook Integration
Create a new file, `config.json` that has the following:
```
{
    "output": {
        "username": "<facebookEmail>",
        "password": "<facebookPassword>",
        "testingName": "<testingName>",
        "commandPrefix": "/"
    }
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets.

To start in facebook mode, run `node main.js facebook`.

#### Slack Integration
<b>This section is still being written.</b>

Create a new file, `config.json` that has the following:
```
{
    "output": {
        "name": "Kassy",
        "slack_teams": [
            {
                "slack_team_id": "<slackTeamId>",
                "slack_token": "<slackToken>"
            },
            ....
        ],
        "port": "<portNumber>",
        "commandPrefix": "!"
    }
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets and update your slack team configuration to match.

To start in slack mode, run `node main.js slack`.

#### Testing Mode

Testing mode requires no configuration. It provides a testing ground to experiment with your modules before using them live in one of the service integrations.

To start in testing mode, run `node main.js` or `node main.js test`.

Additional special commands exist in testing mode that are not in any other mode:

- `/setuser <userName>` - changes your username.

### Special Commands
There are a number of special commands that will not be listed by help and cannot be overridden by custom modules.
- `/help` and `/kassy`. Shows the avalible module commands.
- `/shutdown`. Terminates the program gracefully.
- `/restart`. Restarts the program, reloading and searching for new modules. Useful if you have made changes to an existing module or have created a new module.
- `/disable`. Toggles ignoring of commands - will not ignore special commands.
- `/update`. Performs a git-pull on the repository this is contained within.
- `/ping`. Responds with version and hostname of machine running the program.
- `/creator`. Prints information about the creators of Kassy.

## Creating New Modules
### General Nodes
#### File Locations

- Modules should be created as their own `.js` file within the `modules` (<b>not `node_modules`</b>) subdirectory.
- Modules that depend on other `.js` files should locate those files within a subdirectory of the `modules` directory.

#### `require('module')`
Any modules that depend on an `npm` package should include it using:
```
var require_install = require('require-install'),
    module = require_install('module');
```
instead of:
```
var module = require('module');
```

This is so that `package.json` does not need to be updated for every module and to allow for seemless updating using the built in updator.

### Methods

Every module must provide the same basic methods, which can then be expanded to perform whatever tasks are required. These are as follows:

#### `exports.match(messageText, messageThread, senderName)`
This method is used to test wheather your module should be run on the given message.

Arguments:
- `messageText`. The text of the message that has been received. String.
- `messageThread`. A handle to the thread the message was received on. String.
- `senderName`. The name of the sender. String.
- <i>returns</i>. `true` if the module should run, `false` otherwise. Boolean.

For example, if you were creating a weather module that runs whenever the text `/weather` is written, `match` would return `true` if text was `/weather some data here` and `false` if it was `not what you are wanting`.

#### `exports.help()`
This method should return a <b>non-newline terminated</b> string to be used with the `/kassy` command.

Arguments:
- <i>returns</i>. A non-newline terminated string. String.

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
<i>Please note that not all methods are gaurenteed to work as described if the platform does not support the feature. A fallback will be provided in this case.</i>

The `api` object contains the following methods:
#### `sendMessage(message, thread)`
Sends a message to the specified thread.

Arguments:
- `message`. The message to send. String.
- `thread`. The thread to send it to. String.

#### `sendUrl(url, thread)`
Sends a url to the specified thread. If url linking is not supported, will behave like `sendMessage`.

Arguments:
- `url`. The url to send. String.
- `thread`. The thread to send it to. String.

#### `sendImage(type, image, description, thread)`
Sends an image to the specified thread. If image is a URL it will behave like `sendUrl`, otherwise it will behave like `sendFile`.

Arguments:
- `type`. The type of image being sent. `"url"` for a URL to an image or `"file"` for a local file. String.
- `image`. The image to send. String (url or file location). String.
- `description`. The description to associate with the image. String
- `thread`. The thread to send it to. String.

#### `sendFile(type, file, description, thread)`
Sends a file to the specified thread. If file is a URL it will behave like `sendUrl`, otherwise it will send directly.

Arguments:
- `type`. The type of file being sent. `"url"` for a URL to a file or `"file"` for a local file. String.
- `file`. The file to send. String (url or file location). String.
- `description`. The description to associate with the file. String
- `thread`. The thread to send it to. String.

#### `sendTyping(thread)`
Sends a typing indicator to the specified thread. Will either time out or cancel when the next call to `api` occurs.

Arguments:
- `thread`. The thread to send it to. String.

#### `setTitle(title, thread)`
Sets the title of the specified thread.

Arguments:
- `title`. The title to set. String.
- `thread`. The thread to set it on. String.

### Event
The `event` object contains the following fields:
- `body`. The body of the message received. String.
- `thread_id`. The ID of the thread the message was received from. String.
- `sender_name`. The name of the sender that the message was received from. String.
- `sender_id`. The ID of the sender who sent the message. String.

### Persistence
Any data stored in `this.config` or `exports.config` within the scope of a module will automatically be persistent between restarts of the program, provided a safe shutdown and an error free startup.

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
