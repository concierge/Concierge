## Skype Integration
Create a new file, `config.json` that has the following:
```
{
    "output": {
        "skype": {
            "username": "<skypeUsername/skypeEmail>",
            "password": "<skypePassword>",
            "commandPrefix": "!",
			"acceptContactRequests": true,
            "conversations": ["<conversationID1>","<conversationID2",...]
        }
    }
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets.

|Property|Explanation|
|-|-|
|`username`|Username of the bot account.|
|`password`|Password of the bot account.|
|`commandPrefix`|Command prefix to use with the bot. Note: skype reserves the '/' prefix for its own special commands.|
|`acceptContactRequests`|Optional (default=true). Wheather contact requests to the bot should be automatically accepted.|
|`conversations`|Optional (default=any). ID's of conversations to listen to.|

To start in skype mode, run `node main.js skype`.