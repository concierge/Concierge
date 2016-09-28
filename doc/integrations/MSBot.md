## MSBot Integration
Create a new file, `config.json` that has the following:
```json
{
	"output": {
		"msbot": {
			"key": "<path to TLS key, eg key.pem>",
			"cert": "<path to TLS cert, eg cert.pem>",
			"app_id": "<Microsoft App ID>",
			"app_secret_password": "<Microsoft App Secret Password>",
			"port": <port>,
			"commandPrefix": "!"
		}
	}
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets.

Notes:
- To obtain a TLS certificate easily, the Lets Encrypt project has [easy ways of doing this](https://letsencrypt.org/getting-started/).
- Currently MSBots works on platforms supported [here](https://docs.botframework.com/en-us/csharp/builder/sdkreference/gettingstarted.html#channels).
- Port defaults to 8000.
- If using a service like ngrok, you do not need to supply a key or cert.
- To setup your bot register it [here](https://dev.botframework.com/bots/new).

To start in MSBot mode, run `node main.js msbot`.
