## Creating New Integrations
### Quick Reference
- [Api Object](./api/Api.md)
- [Event Object](./api/Event.md)

### What is an Integration?
An integration is a piece of code used by Concierge to connect with the specified chat platform API. It tells Concierge what to do when opening/closing a connection with the platform, how to send messages, etc. The integration acts like a middleman between Concierge and the chat platform and encapsulates their API nicely.

Creating an integration for a chat platform is a relatively simple process. It can be thought of as a special kind of module that provides I/O for Concierge.

- Each integration must be in its own module located within the modules directory.
- No two integrations are allowed to have the same name.

### Integration Formats
Integrations can take two forms:
- A Native Module (see below).
- A Hubot Adapter. These can be installed as a directory within the `core/core_integrations` directory.

### Methods
Each integration must provide the methods found in [Integration.md](./api/Integration.md).

<a name="HandlingMessages"></a>
## Handling Messages - API and Event
When messages are received by your integration they need to be passed to the callback method. This callback takes an `api` and an `event`.

### Event
The event is an object of the format found in [Event.md](./Event.md).
The best way to generate this object is to use the globally defined object `shim` as can be seen in the following example:
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
Create an object with only the methods needed. This will at runtime extend the `IntegrationApi` class as needed. The `commandPrefix` for your module should be provided within the object.
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

#### \_chunkMessage(message, limit, callback) => <code>Array</code>
Splits a message into chunks with a given message size, returns an array of messages. Includes an optional callback which is passed the array of messages.

**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | the message to chunk. |
| limit | <code>Integer</code> | the size of each message chunk. |
| ?callback | <code>Function</code> | optional callback. |

**Example**
Chunk <code>"This is a test of a very long message. But one that is not too long\n I mean come on how much text do you expect me to make up for this. I'm simply too lazy to do more."</code>
```js
let message = 'This is a test of a very long message. But one that is not too long\n I mean come on how much text do you expect me to make up for this. I\'m simply too lazy to do more.',
 newMesage = _chunkMessage(message, 10);

 // [ 'This is a ', 'test of a ', 'very long ', 'message. ', 'But one ', 'that is ', 'not too ', 'long\n I ', 'mean come ', 'on how ', 'much text ', 'do you ', 'expect me ', 'to make ', 'up for ', 'this. I\'m ', 'simply ', 'too lazy ', 'to do ', 'more.' ]
```

### Best Practises
- In order to be configurable at runtime, an integration should not read/depend on full configuration until the point that `start` is called. Before this point (e.g. in `load`) configuration should not be required for use (it can be initialised or looked at but not depended upon).
