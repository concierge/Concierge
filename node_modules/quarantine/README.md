# Quarantine

## Run dangerous, dirty code without (too much) fear.

### Usage:

```
var quarantine = require("quarantine")(timeoutInMilliseconds);
quarantine([context], stringifiedScript, [callback])
```

### Examples:

##### Success

```
var quarantine = require("quarantine")(500);

quarantine({foo: "bar"}, "(function(){return foo;})()", console.log);
```

result: 

```
null 'bar'
```

##### Catching errors

```
var quarantine = require("quarantine")(500);

quarantine("(function(){require('fs');})()", console.log);
```

result: 

```
[Error: require is not defined]
```

##### Catching evil

```
var quarantine = require("quarantine")(500);

quarantine("(function(){while(true);})()", console.log);
```

result: 

```
{ [Error: Worker timed out!] code: 'E_WORKER_TIMEOUT' }
```
