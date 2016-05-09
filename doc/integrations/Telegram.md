## Telegram Integration
Create a new file, `config.json` that has the following:

```
{
    "output": {
        "telegram": {
            "token": "<telegramToken>",
            "commandPrefix": "/"
        }
    }
}
```

Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets.

To start in skype mode, run `node main.js telegram`.
