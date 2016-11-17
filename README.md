# Concierge
[![Build Status](https://api.travis-ci.org/concierge/Concierge.svg?branch=master)](https://travis-ci.org/concierge/Concierge) [![Build status](https://ci.appveyor.com/api/projects/status/eis48if0bf8ynq69?svg=true)](https://ci.appveyor.com/project/mrkno/concierge) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/0d267567f8874ad2ae3d72ac44c9c492)](https://www.codacy.com/app/Concierge/Concierge?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=concierge/Concierge&amp;utm_campaign=Badge_Grade)

(Karma + Sassy) * (Discord + Facebook + Messenger + Slack + Skype + Telegram) = Concierge


Concierge is a modular, easily extensible general purpose chat bot. It is platform agnostic and will work with any social network (provided an integration module) desired. The bot utilises small node.js modules for responding in a chat.
You can write your own modules and place them in the [modules](https://github.com/concierge/Concierge/tree/master/modules) directory, or use existing modules we've collated [here](https://github.com/concierge/Concierge/wiki/KPM-Table). Existing modules include a variety of functionality from getting gifs,  to running arbitrary sandboxed JavaScript code, voting and giving karma.

Furthermore Concierge is compatible with [Hubot](https://github.com/github/hubot) adapters and integrations.

## Getting Started

#### Pre-Requisites
Make sure you have **GIT** and **NPM** installed and added to your system PATH before installing Concierge.
- [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Install NPM](https://nodejs.org/en/download/)

#### Installation
Open a terminal/prompt and enter the following commands to clone the repository and install required npm packages:
```
git clone https://github.com/concierge/Concierge.git
cd Concierge
npm install
```

#### Configuration
After a successful Concierge installation, it needs to be configured to connect with your social network.
We will connect with Facebook in this example *(since there is a 1 in 4 chance you have a Facebook account)*

Navigate to Concierge's root directory (in the directory that contains main.js) and create a new file, `config.json` that has the following:
```
{
    "output": {
        "facebook": {
            "username": "<facebookEmail>",
            "password": "<facebookPassword>",
            "commandPrefix": "/"
        }
    }
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information hinted inside the brackets. The `commandPrefix` is a textual marker. Any messages meant for Concierge should begin with the `commandPrefix`.

**NOTE**: Facebook account which is configured into Concierge will NOT be usable to send commands to itself (you will need two accounts). The reasons behind this are documented [here](https://github.com/concierge/Concierge/issues/77#issuecomment-209161404) and [here](https://github.com/concierge/Concierge/issues/77#issuecomment-181676118).

Any and all integrated social networks should be configured through this file alone. The parent `"facebook": {...}` tag specifies the integration name. Therefore, you can configure multiple integrations by simply adding another entry underneath it
```
{
    "output": {
        "facebook": {
            ...
        },
		"slack": {
            ...
        },
		"skype": {
            ...
        }
    }
}
```
More information on configuring other integrations can be found in the documentation section below.

#### Starting Up
Awesome job finishing up the tedious bits. Let's have some fun now.
- Open up a terminal/prompt, navigate to Concierge's root directory
- Start Concierge with Facebook's integration name *(so it knows which integration to connect with)* by using `node main.js facebook`.
- Open your non-Concierge Facebook account and send this message to the Concierge-configured account: `/ping`
- It should reply back with something like:

> Concierge 4.0.0 @ Raven (Linux x64)

If you've successfully received a message back from Concierge,

**Congratulations!**

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
 		- [Testing Mode](https://github.com/concierge/testing)
	- [Creating Integrations](doc/IntegrationCreation.md)
		- [Integration Methods](doc/api/Integration.md)
- [**CLI Arguments**, Debugging and Logging](doc/Options.md)
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
