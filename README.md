# Concierge
[![Build Status](https://api.travis-ci.org/concierge/Concierge.svg?branch=master)](https://travis-ci.org/concierge/Concierge) [![Build status](https://ci.appveyor.com/api/projects/status/eis48if0bf8ynq69?svg=true)](https://ci.appveyor.com/project/mrkno/concierge) 

[![NPM](https://nodei.co/npm/concierge-bot.png?compact=true)](https://npmjs.org/package/concierge-bot)

(Karma + Sassy) * (Discord + Facebook + Messenger + Slack + Skype + Telegram) = Concierge


Concierge is a modular, easily extensible general purpose chat bot. It is platform agnostic and will work with any social network desired (provided an integration module). The bot utilises small node.js modules for responding in a chat.
You can write your own modules and place them in the [modules](https://github.com/concierge/Concierge/tree/master/modules) directory, or use existing modules we've collated [here](https://github.com/concierge/Concierge/wiki/KPM-Table). Existing modules include a variety of functionality from getting gifs,  to running arbitrary sandboxed JavaScript code, voting and giving karma.

Furthermore Concierge is compatible with [Hubot](https://github.com/github/hubot) adapters and scripts.

## Getting Started

#### Pre-Requisites
Make sure you have **GIT** and **NPM** installed and added to your system PATH before installing Concierge.
- [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Install NPM](https://nodejs.org/en/download/)

#### Installation
Installation can either be done using `git` or `npm` ([see which approach is right for you here](doc/UsageTypes.md)). One approach is to open a terminal/prompt and enter the following commands to clone the repository and install required npm packages:
```
git clone https://github.com/concierge/Concierge.git
cd Concierge
npm install
```
Now you are ready to use and develop modules for Concierge.

#### Starting Up
Concierge comes ready-to-run, so to start the bot:
- Open up a terminal/prompt, navigate to Concierge's root directory
- Start Concierge using `node main.js` (or alternatively `npm start`)
- First startup will install some of the default modules (these can be configured [here](doc/DefaultCommands.md)) and If all goes well, you should see a prompt prefixed

> Concierge-bot>

This is the default `Test` integration Concierge assumes if no other is specified during startup (more on this below).
- You can further test the bot's responses by calling a few of the default commands. Try entering `/ping` in the terminal and press enter.
- It should reply back with something like:

> Concierge-bot 4.0.0-beta.0 @ Raven (Linux x64)

If everything worked without any errors,

**Congratulations!**

Now let's go a step further and connect Concierge with an actual social network

#### Integrating with a social network
This simply requires installing the social network's `integration` in the `modules` directory.

[kpm](https://github.com/concierge/kpm) is a great module that makes this process a piece of cake. The process can be generalized into the following steps

- Run Concierge and ensure `kpm` was successfully loaded.
- Use `/kpm install <integration_name>` to install the integration where `<integration_name>` is the name of the social network integration.
- Use `/kpm config` with appropriate arguments *(account email, account password, etc.)* to set up the integration for connecting with the social network. Specific arguments and instructions on how to set them can be found in the integration's documentation.
- Use `/kpm start <integration_name>` to start the integration.

Why not try integrating Concierge with Facebook by following the instructions [here](https://github.com/concierge/facebook).

Links to configuring other integrations can be found in the documentation section below.

#### What Now
Now you can customize your Concierge by installing or creating your own modules.

- You can install an existing modules from the [KPM Modules List](https://github.com/concierge/Concierge/wiki/KPM-Table). Use the `/kpm` module *(which is installed by default)* to install using the KPM List.
- Or create your own modules by following the [ Module Creation](doc/ModuleCreation.md) guide.

**Hint**: Use `/help kpm` to find out how to install a module or have a look at the KPM List for a more elaborate instructions.

## Documentation
- [Creating Modules](doc/ModuleCreation.md)
	- [Module Methods](doc/api/Module.md)
	- [Service Methods](doc/api/Service.md)
	- [API Object](doc/api/Api.md)
	- [Event Object](doc/api/Event.md)
	- [kassy.json](doc/api/Kassy.json.md)
	- [Translations](doc/api/Translation.md)
- [KPM Modules Table](https://github.com/concierge/Concierge/wiki/KPM-Table)
- [Default Commands](doc/DefaultCommands.md)
- [Usage Types](doc/UsageTypes.md)
- [Usage Example/Overview](https://github.com/concierge/Concierge/issues/77#issuecomment-181676118)
- Integrations (Integrations are chat platforms that Concierge integrates into)
	- Existing Integrations. *Look here for documentation on how to set them up.*
		- [Facebook Integration](https://github.com/concierge/facebook)
		- [Slack Integration](https://github.com/concierge/slack)
		- [Discord Integration](https://github.com/concierge/discord)
		- [Skype Integration](https://github.com/concierge/skype)
		- [Telegram Integration](https://github.com/concierge/telegram)
		- [Messenger Bots](https://github.com/concierge/messenger)
 		- [MSBot](https://github.com/concierge/msbot)
		- [HipChat](https://github.com/concierge/hipchat)
		- [SSH](https://github.com/concierge/ssh)
 		- [Testing Mode](https://github.com/concierge/test)
	- [Creating Integrations](doc/IntegrationCreation.md)
		- [Integration Methods](doc/api/Integration.md)
- [**CLI Arguments**, Debugging and Logging](doc/Options.md)
- [Docker](doc/Docker.md)
- [Contributing](doc/Contributing.md)

### Testing
See [Running and writing tests](doc/Testing.md)

## Contributions
Contributions welcome, see [Contributing](doc/Contributing.md).

## Copyright and License
Licensed under the MIT license. Unless otherwise specified, code is Copyright (c) Matthew Knox 2017.
