## Facebook Integration
Create a new file, `config.json` that has the following:
```
{
	"output": {
		"facebook": {
			"username": "<facebookEmail>",
			"password": "<facebookPassword>",
			"testingName": "<testingName>",
			"commandPrefix": "/"
		}
	}
}
```
Replace each of the angle bracketed strings (`<...>`) with the respective information written inside the brackets.

To start in Facebook mode, run `node main.js facebook`.
