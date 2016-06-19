## Integration Creation
Integrating a new platform into Kassy is a relatively simple process. It can be thought of as a special kind of module that provides I/O for Kassy.

Each integration must be in its own javascript file located within the directory `core/output`. If additional files are required for an output module they must not be located within this directory or a subdirectory of it - this is to ensure that Kassy can accurately search for new integrations.

### Methods
Each integration must provide the following methods:

#### `exports.start(callback)`
Called when the integration should start up.

Arguments:
- `callback` - A function that should be called when a message is received. See below for details. Function.
- <i>Return:</i> `undefined`

###### `callback(api, event)`
Should be called when a message is received from your chat service.

Arguments:
- `api` - Provides methods for the end modules to call. Refer to [module documentation](ModuleCreation.md) under the API section for what should be provided. Note also that not all methods need be provided if you are using shim (see below). Object.
- `event` - Provides details about the message received. Refer to [module documentation](ModuleCreation.md) under the event section for what should be provided. Note that the fields starting with `argument` should not be provided, can be generated using shim (see below). Object.
- <i>Returns:</i> `undefined`

#### `exports.stop()`
Called when the integration should stop.

Please note: in order to ensure restarting actually correctly reloads changes, it is necessary to treat this method as if it is synchronous. For the most part this can be a best effort job, and at the very least prevent new messages being received after this method is called. It is imperative that after this method is called, your integration halts such that no background operation is keeping Kassy alive.

Arguments:
- <i>Return:</i> `undefined`

### Shim
Not all chat platforms provide every piece of functionality. As a result implementing the API for each one of the missing bits of functionality is a needless hassle. Instead `shim` should be used in your integration. It will provide fallback methods where you have not created them.

Usage Example:
```
var myApiObject = {
  sendMessage = function(....){}
};

var api = shim.createIntegration(myApiObject); // pass this api to callback
```
This will ensure that although the `myApiObject` only provides a `sendMessage()` implementation, the api generated will have all methods, with fallbacks.
It will also ensure that any future APIs that are created will not break your integration.

Shim can also be used to generate event objects for a callback.
Example:
```
exports.start = function(callback) {
....
  var threadId = getThreadId(),
    content = getMessageBody(),
    senderId = getSenderId(),
    senderName = getSenderName();

  var event = shim.createEvent(threadId, senderId, senderName, content);
  callback(api, event);
...
}
```
This will simply copy the required fields into a new object that can be used with the callback.
