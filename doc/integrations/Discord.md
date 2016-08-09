## Discord Integration
Create a new file, `config.json` that has the following:
```
{
    "output": {
        "discord": {
            "commandPrefix": "!",
            "token": "<token>",
            "avatarUrl": "<urlToImage>",
            "name": "<nameOfBot>"
        }
    }
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets and update your slack team configuration to match.

token and commandPrefix are required, as the default command prefix of `/` is reserved in discord. Other parameters are optional.

Invite the bot to channels which you want it to respond to commands in.

To start the discord integration run `node main.js discord`.
