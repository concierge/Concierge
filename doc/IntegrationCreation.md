## Integration Creation
Integrating a new chat platform into Concierge is a relatively simple process. It can be thought of as a special kind of module that provides I/O for Concierge.

Integrations can take two forms:
- A Native Script (see below).
- A Hubot Adapter. These can be installed as a directory within the `core/core_integrations` directory.

## Concierge Integration Format
Each integration must be in its own JavaScript file or directory located within the directory `core/core_integrations`. If a directory is used, it must contain a `package.json` file which has both the `name` (name of the integration) and `main` (entry point of the integration) properties within it. Stand-alone JavaScript files will derive their integration name from the name of the script file. No two integrations are allowed to have the same name.

### Methods
Each integration must provide the methods found in [Integration.md](./api/Integration.md).

<a name="HandlingMessages"></a>
## Handling Messages - API and Event
When messages are received by your integration they need to be passed to the callback method. This callback takes an `api` and an `event`.

### Event
The event is an object of the format found in [Event.md](./Event.md).  
The easiest way to generate this object is to use the globally defined object `shim` as can be seen in the following example:
```js
let event = shim.createEvent(thread_id, sender_id, sender_name, body);
```

### API
The API must provide all of the methods found in [Api.md](./api/Api.md). As it is not possible for every platform to provide every API, it is possible to use the globally provided `shim` object to simplify the process of creating this API as seen below. It is recommended you only create an API once per call of the `start method`. At the most basic level, the `sendMessage` method **must** be provided.

#### Appoach 1: ES6 Class Extension
Extend only the methods needed and create a new instance of the class. A `commandPrefix` must be passed during instantiation of the base class.
```js
class TestIntegration extends shim {
    sendMessage(message, thread) {
        // some implementation of sendMessage
    }
}
let api = new TestIntegration(exports.config.commandPrefix);
```

#### Approach 2: Object Definition
Create an object with only the methods needed. This will at runtime extend the IntegrationApi class as needed. The `commandPrefix` for your module should be provided within the object.
```js
let apiObject = {
    commandPrefix: exports.config.commandPrefix,
    sendMessage: function(message, thread) {
        // some implementation of sendMessage
    }
};
let api = shim.createIntegration(apiObject);
```

### Convenience Methods

<a name="\_chunkMessage"></a>
#### \_chunkMessage(message, limit, callback) => <code>Array</code>
Splits a message into chunks with a given message size, returns an array of messages. Includes an optional callback which is passed the array of messages.

**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | the message to chunk. |
| limit | <code>Integer</code> | the size of each message chunk. |
| ?callback | <code>Function</code> | optional callback. |

**Example**  
chunk 'This is a test of a very long message. But one that is not too long\n I mean come on how much text do you expect me to make up for this. I\'m simply too lazy to do more.'
```js
let message = 'This is a test of a very long message. But one that is not too long\n I mean come on how much text do you expect me to make up for this. I\'m simply too lazy to do more.',
 newMesage = _chunkMessage(message, 10);

 \\ [ 'This is a ', 'test of a ', 'very long ', 'message. ', 'But one ', 'that is ', 'not too ', 'long\n I ', 'mean come ', 'on how ', 'much text ', 'do you ', 'expect me ', 'to make ', 'up for ', 'this. I\'m ', 'simply ', 'too lazy ', 'to do ', 'more.' ]
```
