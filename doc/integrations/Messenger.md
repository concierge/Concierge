## Messenger Integration
Create a new file, `config.json` that has the following:
```json
{
	"output": {
		"messenger": {
			"key": "<path to TLS key, eg key.pem>",
			"cert": "<path to TLS cert, eg cert.pem>",
			"ca": "<path to TLS ca cert, eg cert.pem - note NOT full chain>",
			"token": "<messenger API token>",
			"verify": "<verify secret message>",
			"port": <port>,
			"commandPrefix": "/"
		}
	}
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets.

Notes:
- To obtain a TLS certificate easily, the Lets Encrypt project has [easy ways of doing this](https://letsencrypt.org/getting-started/).
- Currently messenger bots cannot be run in group chats due to limitations at Facebooks end.
- To obtain a token and verify with a webhook, refer to the messenger section of [http://developer.facebook.com](http://developer.facebook.com).
- Messages the bot send cannot be longer than 320 characters each. So to deal with this we split up messages, this causes commands such as `help` to load really slowly...

To start in Messenger Bots mode, run `node main.js messenger`.
