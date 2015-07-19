# Kassy
(Karma + Sassy) * Facebook - Hipchat = Kassy

## Usage
Set the username and password inside the `server.js` file for a facebook account and start using `node server.js`.
Inside a facebook chat involving the person who was logged in type `/kassy` for avalible commands.

## Contributions
Contributions welcome.

### Creating New Modules
Modules should be created as their own javascript files. They must expose the following methods:
* `match(text)` where text is the body of a facebook message. This method should return true if the module should be run on this message and false otherwise. For example, if you were creating a weather module that runs whenever the text `/weather` is written, `match(text)` would return true if text was `/weather some data here` and false if it was `not what you are wanting`.
* `exports.help()`. This method should return a <b>non-newline terminated</b> string to be used with the `/kassy` command.
* `exports.load()`. This method is called once when the program is first starting up. Facebook is not gaurenteed to be running at this point. Should be used to initialise variables or load files, etc as appropriate.
* `exports.run(api,event)`. This method is called whenever the module should be run. api is an object that allows you to perform all the api methods outlined here: https://github.com/Schmavery/facebook-chat-api . event is an object that contains information about the message received. Of particular note is `event.body` which contains text typed.

Modules can be loaded into Kassy by first adding a require at the top of server.js, then adding the module to the array of modules within that file.

## Disclaimer
HERE BE DRAGONS!
Written to see if it could be done, not written to be readable. Enter at your own peril.

## Copyright and License
All code unless otherwise specified is Copyright Matthew Knox (c) 2015.
Licensed under the MIT license.
