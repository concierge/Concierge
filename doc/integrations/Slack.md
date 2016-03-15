## Slack Integration
Create a new file, `config.json` that has the following:
```
{
    "output": {
        "slack": {
            "name": "Bot",
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

Slack integration supports multiple teams at once simply add your teams slack bot token to config.json and start the bot

Tokens can be issued from here https://slack.com/apps/A0F7YS25R-bots
You will need to give the bot a user name.

Invite the bot to channels which you want it to respond to commands in.

To start in slack mode, run `node main.js slack`.
