# Kassy
(Karma + Sassy) * Facebook - Hipchat = Kassy

<i>It does way more than this now...</i>

## Usage
Create a new file, `config.json` that has the following:
```
{
    "output": {
        "username": "<facebookEmail>",
        "password": "<facebookPassword>",
        "testingName": "<testingName>"
    }
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets.

Before running the program, first perform an `npm install` inside the directory containing `package.json`.

To start in testing mode, run the program using:<br>
`node main.js testing` or just `node main.js`.

Live Facebook chat mode can be started using:<br>
`node main.js facebook`.

Once the bot is running, type `/help` for a list of commands.

#### Special Commands
There are a number of special commands that will not be listed by help and cannot be overridden by custom modules.
- `/help` and `/kassy`. Shows the avalible module commands.
- `/shutdown`. Terminates the program gracefully.
- `/restart`. Restarts the program, reloading and searching for new modules. Useful if you have made changes to an existing module or have created a new module.
- `/disable`. Toggles ignoring of commands - will not ignore special commands.
- `/update`. Performs a git-pull on the repository this is contained within.
- `/ping`. Responds with version and hostname of machine running the program.

## Contributions
Contributions welcome.

### Creating New Modules

#### `require('moduleName')`
Please <b>do not use `require('module')`</b> unless requiring another `.js` file you have created (Note: when restarting, other `.js` files you have created and loaded through `require` will not be reloaded like your module will. It is your responsability to ensure this occurs.).

To require an `npm` module please use the following code:
```
var require_install = require('require-install'),
    module = require_install('module');
```
and add the associated module to `package.json` using `npm install module --save`.

To require a `.js` file you have created yourself, please place this file within a subdirectory within the `modules` directory. This is to prevent an attempt to load it as a module.

#### Interface Contract
Modules should be created as their own javascript files within the `modules` subdirectory. They must expose the following methods:
* `exports.match(text,thread,senderName)` where `text` is the body of a Facebook message, `thread` is the message thread it occurred on and `senderName` is the name of the sender. This method should return `true` if the module should be run on this message and `false` otherwise. For example, if you were creating a weather module that runs whenever the text `/weather` is written, `match(text,thread)` would return `true` if text was `/weather some data here` and `false` if it was `not what you are wanting`.
* `exports.help()`. This method should return a <b>non-newline terminated</b> string to be used with the `/kassy` command.
* `exports.load()`. <i>Optional</i>. This method is called once when the program is first starting up. Facebook is not guaranteed to be running at this point. Should be used to initialise variables or load files, etc as appropriate.
* `exports.unload()`. <i>Optional</i>. This method is called once when the program is shutting down. Facebook is not guaranteed to be available at this point. Should be used to unload files and cancel any timers. Failure to use this method correctly can prevent a successful restart.
* `exports.run(api,event)`. This method is called whenever the module should be run. `api` is an object that allows you to perform all the api methods outlined [here](https://github.com/Schmavery/facebook-chat-api). `event` is an object that contains information about the message received. Of particular note is `event.body` which contains text typed.

#### Persistence
Any data stored in `this.config` within the scope of a module will automatically be persistent between restarts of the program, provided a safe shutdown and an error free startup.

#### Loading Modules
New modules will be automatically detected and loaded after a restart of the application.

## Disclaimer
HERE BE DRAGONS!
Written to see if it could be done, not written to be readable.<br><b>Enter at your own peril.</b>

## Copyright and License
All code unless otherwise specified is Copyright Matthew Knox (c) 2015.
Licensed under the MIT license.
