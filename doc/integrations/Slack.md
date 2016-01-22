## Slack Integration
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
