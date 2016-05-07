# Kassy
(Karma + Sassy) * (Facebook + Slack + Skype + Hipchat) = Kassy

<i>It does way more than this now...</i>

Kassy is a modular, easily extensible general purpose chat bot. Small node.js modules can be written for it then placed in the modules directory. They will load on startup (or restart) and become part of what the chat bot provides. Current pre-installed modules are located [here](https://github.com/mrkno/Kassy/tree/master/modules), additional modules can be created or installed through the built in package manager. Existing modules include a variety of functionality from getting animated gifs to running arbitrary sandboxed JavaScript code, voting and giving karma.

## Basic Usage
First clone the repository and install required npm packages:
```
git clone https://github.com/mrkno/Kassy.git
cd Kassy
npm install
```
Then start one or more of the available integrations:<br/>
(eg. `node main.js facebook slack skype test` after configuring to start them all)

### Modules
- [Creating Modules](doc/ModuleCreation.md)
- [KPM Modules List](https://github.com/mrkno/Kassy/wiki/KPM-Table)

### All Documentation
- [Creating Modules](doc/ModuleCreation.md)
- [KPM Modules Table](https://github.com/mrkno/Kassy/wiki/KPM-Table)
- [Special Commands](doc/SpecialCommands.md)
- [Usage Example/Overview](https://github.com/mrkno/Kassy/issues/77#issuecomment-181676118)
- Integrations (Integrations are chat platforms that Kassy integrates into)
	- Existing Integrations. *Look here for documentation on how to set them up.*
		- [Facebook Integration](doc/integrations/Facebook.md)
		- [Slack Integration](doc/integrations/Slack.md)
		- [Skype Integration](doc/integrations/Skype.md)
		- [Telegram Integration](doc/integrations/Telegram.md)
		- [Testing Mode](doc/integrations/Testing.md)
	- [Creating Integrations](doc/IntegrationCreation.md)
- [**CLI Arguments**, Debugging and Logging](doc/DebuggingAndLogging.md)

## Disclaimer
HERE BE DRAGONS!
Written to see if it could be done, not written to be readable.<br><b>Enter at your own peril.</b>

## Contributions
Contributions welcome.

## Copyright and License
Licensed under the MIT license. Unless otherwise specified, code is Copyright (c) Matthew Knox 2015.
