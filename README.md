# Concierge
[![Build Status](https://travis-ci.org/concierge/Concierge.png)](https://travis-ci.org/concierge/Concierge)

(Karma + Sassy) * (Facebook + Slack + Skype + Hipchat + Telegram) = Concierge

<i>It does **way** more than this now...</i>

Concierge is a modular, easily extensible general purpose chat bot. Small node.js modules can be written for it then placed in the modules directory - some examples can be found [here](https://github.com/concierge/Concierge/wiki/KPM-Table). Current pre-installed modules are located [here](https://github.com/concierge/Concierge/tree/master/modules), additional modules can be created or installed through the built in package manager. Existing modules include a variety of functionality from getting animated gifs to running arbitrary sandboxed JavaScript code, voting and giving karma.

## Basic Usage
First clone the repository and install required npm packages:
```
git clone https://github.com/concierge/Concierge.git
cd Concierge
npm install
```
Then start one or more of the available integrations:<br/>
(eg. `node main.js facebook slack skype test` after configuring to start them all)

### Modules
- [Creating Modules](doc/ModuleCreation.md)
- [KPM Modules List](https://github.com/concierge/Concierge/wiki/KPM-Table)

### All Documentation
- [Creating Modules](doc/ModuleCreation.md)
- [KPM Modules Table](https://github.com/concierge/Concierge/wiki/KPM-Table)
- [Special Commands](doc/SpecialCommands.md)
- [Usage Example/Overview](https://github.com/concierge/Concierge/issues/77#issuecomment-181676118)
- Integrations (Integrations are chat platforms that Concierge integrates into)
	- Existing Integrations. *Look here for documentation on how to set them up.*
		- [Facebook Integration](doc/integrations/Facebook.md)
		- [Slack Integration](doc/integrations/Slack.md)
		- [Discord Integration](doc/integrations/Discord.md)
		- [Skype Integration](doc/integrations/Skype.md)
		- [Telegram Integration](doc/integrations/Telegram.md)
		- [Messenger Bots](doc/integrations/Messenger.md)
		- [Testing Mode](doc/integrations/Testing.md)
	- [Creating Integrations](doc/IntegrationCreation.md)
- [**CLI Arguments**, Debugging and Logging](doc/DebuggingAndLogging.md)
- [Admin Controls](doc/AdminControls.md)
- [Docker](doc/Docker.md)
- [Contributing](doc/Contributing.md)

### Testing
See [Running and writing tests](doc/Testing.md)

## Disclaimer
HERE BE DRAGONS!
Written to see if it could be done, not written to be readable.<br><b>Enter at your own peril.</b>

## Contributions
Contributions welcome, see [Contributing](doc/Contributing.md).

## Copyright and License
Licensed under the MIT license. Unless otherwise specified, code is Copyright (c) Matthew Knox 2015.
