## Skype Integration
Create a new file, `config.json` that has the following:
```
{
	"output": {
		"skype": {
			"username": "<skypeUsername/skypeEmail>",
			"password": "<skypePassword>",
			"commandPrefix": "!",
			"conversations": ["<conversationID1>","<conversationID2",...]
		}
	}
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets.

<i>Note: the conversations option is optional and if it is not included all conversations will be listened to.</i>

To start in skype mode, run `node main.js skype`.

<b>Please note: the account that Kassy is logged in as will not see the messages it sends.</b>
