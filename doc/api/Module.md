# Module
A Concierge Module is a module that listens for messages from users and acts upon them. Long running operations should not be performed by this module type - these should be done by [services](./Service.md).

## Functions
These functions should be implemented as needed on the `exports` object of your module. A module may also optionally implement any methods avalible to a [service](./Service.md).

<dl>
<dt><a href="#run">run(api, event)</a></dt>
<dd><p>The main entry point of the module.</p></dd>
<dt><a href="#match">match(event, commandPrefix)</a></dt>
<dd><p>Evaluates if the module should be run for the given event.</p></dd>
<dt><a href="#help">help(commandPrefix)</a></dt>
<dd><p>Gets help text for the module.</p></dd>
</dl>

## Properties
These properties are set automatically by Concierge on the `exports` object. They should **not** be manually overridden unless there is a valid reason for doing so.

<dl>
<dt><a href="#config">config</a></dt>
<dd><p>Object for storing configuration data of the module within.</p></dd>
<dt><a href="#platform">platform</a></dt>
<dd><p>A reference to the Concierge core platform. This provides access to control methods of the bot and a means to get access directly to integration APIs.</p></dd>
<dt><a href="#descriptor">__descriptor</a></dt>
<dd><p>The internal representation of `kassy.json`. Contains information such as the name and version of the module.</p></dd>
</dl>

<hr />

<a name="run"></a>
## run(api, event) ⇒ <code>boolean</code>
The main entry point of the module.
This will only be executed if [match](#match) returns `true`.

**Required**
**Kind**: API method
**Returns**: <code>true</code> if no further modules should be executed, <code>false</code>|<code>undefined</code> (nothing) otherwise.

| Param | Type | Description |
| --- | --- | --- |
| api | <code>IntegrationApi</code> | The API associated with the integration that the event was raised on. See [Api.md](./Api.md). |
| event | <code>EventObject</code> | An object describing the event that was raised. See [Event.md](./Event.md). |

**Example**
A simple hello world implementation:
```js
exports.run = (api, event) => {
    api.sendMessage('Hello World', event.thread_id);
}
```

<a name="match"></a>
## match(event, commandPrefix) ⇒ <code>boolean</code>
Evaluates if the module should be run for the given event.
This will be run for every received event so should not contain any time consuming code, instead should just return true/false depending on if it should be run or not.

**Required**
**Note**: This method should not be implemented if the `"command"` property has been provided in `kassy.json`. See [Kassy.json.md#command](./Kassy.json.md#command) for details.
**Kind**: API method
**Returns**: <code>true</code> if the module should run, false otherwise.

| Param | Type | Description |
| --- | --- | --- |
| event | <code>EventObject</code> | An object describing the event that was raised. See [Event.md](./Event.md). |
| commandPrefix | <code>string</code> | The command prefix associated with the integration that the event was raised on. See [Api.md#commandPrefix](./Api.md#commandPrefix). |

**Example**
A simple hello world implementation:
```js
exports.match = (event, commandPrefix) => {
    return event.arguments[0] === commandPrefix + 'HelloWorld';
}
```

<a name="help"></a>
## help(commandPrefix) ⇒ <code>array[array[string, string, string?]]</code>
Gets help text for the module. This method is only ever used by the (installed by default) help module. Even though it is not required, it is highly recommended and is the standard way of providing help for a module.

**Optional**
**Note**: This method should not be implemented if the `"help"` property has been provided in `kassy.json`. See [Kassy.json.md#help](./Kassy.json.md#help) for details.
**Kind**: API method
**Returns**: <code>array[array[string, string, string?]]</code>, see [Kassy.json.md#help](./Kassy.json.md#help) for details.

| Param | Type | Description |
| --- | --- | --- |
| commandPrefix | <code>string</code> | The command prefix associated with the integration that the help was requested on. See [Api.md#commandPrefix](./Api.md#commandPrefix). |

**Example**
A simple hello world implementation:
```js
exports.help = (commandPrefix) => {
    return [
        [commandPrefix + 'HelloWorld', 'Prints "Hello World".'],
        [commandPrefix + 'HelloWorldExtended', 'Prints "Hello World".', 'Prints "Hello World" with extended help.']
    ];
}
```

<a name="config"></a>
## config ⇒ <code>Object</code>
**Kind**: Object property

Object for storing configuration data of the module within. Provided the config (or other persistence) module is installed, any property set on this object will automatically be persisted between restarts of your module; usually to a `config.json` file within your modules directory. Please note that although this file has the same name as the global configuration file, it is not the same (different location and contains configuration only for your module).

<a name="platform"></a>
## platform ⇒ <code>Platform</code>
**Kind**: Object property

A reference to the Concierge core platform. This provides access to control methods of the bot and a means to get access directly to integration APIs. Refer to JSDoc in platform.js for details.

<a name="descriptor"></a>
## \__descriptor ⇒ <code>object</code>
**Kind**: Object property
**Unstable**: Should be treated as unstable, and has only been provided for convinience

The internal representation of `kassy.json`. Contains information such as the name and version of the module. See [Kassy.json.md](./Kassy.json.md#version). Note that although it may be similar in structure to `kassy.json`, it is not the same and will contain some additional properties.
