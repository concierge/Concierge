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

<b>Note: the account that is logged in as will NOT be able to command it. The reasons behind this are documented [here](https://github.com/concierge/Concierge/issues/77#issuecomment-209161404) and [here](https://github.com/concierge/Concierge/issues/77#issuecomment-181676118).</b>
