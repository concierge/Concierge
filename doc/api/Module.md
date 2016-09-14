## Functions
These functions should be implemented as needed on the `exports` object of your module.

<dl>
<dt><a href="#run">run(api, event)</a></dt>
<dd><p>The main entry point of the module.</p>
</dd>
<dt><a href="#match">match(event, commandPrefix)</a></dt>
<dd><p>Evaluates if the module should be run for the given event.</p>
</dd>
~~<dt><a href="#matchd">match(text, commandPrefix)</a></dt>~~ __Deprecated__
~~<dd><p>Evaluates if the module should be run for the given text.</p>~~
</dd>
<dt><a href="#help">help(commandPrefix)</a></dt>
<dd><p>Gets help text for the module.</p></dd>
<dt><a href="#load">load()</a></dt>
<dd><p>Called when the all the resources for a module are loaded.</p></dd>
<dt><a href="#unload">unload()</a></dt>
<dd><p>Called when the module resources should be unloaded and timers should be cancelled.</p></dd>
</dl>

## Properties
These properties are set automatically by Concierge on the `exports` object. They should **not** be manually overridden unless there is a valid reason for doing so.

<dl>
<dt><a href="#config">config</a></dt>
<dd><p>Object for storing configuration data of the module within.</p></dd>
<dt><a href="#platform">platform</a></dt>
<dd><p>A reference to the Concierge core platform. This provides access to control methods of the bot and a means to get access directly to integration APIs.</p></dd>
<dt><a href="#version">\__version</a></dt>
<dd><p>The version of the module from `kassy.json`.</p></dd>
~~<dt><a href="#coreOnly">\__coreOnly</a></dt>~~ __Deprecated__
~~<dd><p>Is the module a core module.</p></dd>~~
<dt><a href="#loaderPriority">\__loaderPriority</a></dt>
<dd><p>The loading priority as an integer from `kassy.json`.</p></dd>
<dt><a href="#folderPath">\__folderPath</a></dt>
<dd><p>The folder that the module is stored within.</p></dd>
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

<a name="matchd"></a>
## ~~match(text, commandPrefix) ⇒ <code>boolean</code>~~
__Deprecated__  
Use [match(event, commandPrefix)](#match) instead.

Evaluates if the module should be run for the given message.  
This will be run for every received message so should not contain any time consuming code, instead should just return true/false depending on if it should be run or not.  

**Note**: This method should not be implemented if the `"command"` property has been provided in `kassy.json`. See [Kassy.json.md#command](./Kassy.json.md#command) for details.  
**Node**: This method will be called only if the first parameter is called `text`.  
**Kind**: API method  
**Returns**: <code>true</code> if the module should run, false otherwise.

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | An string containing the body of the message. See [Event.md#body](./Event.md#body). |
| commandPrefix | <code>string</code> | The command prefix associated with the integration that the event was raised on. See [Api.md#commandPrefix](./Api.md#commandPrefix). |

**Example**  
A simple hello world implementation:
```js
exports.match = (text, commandPrefix) => {
    return text.startsWith(commandPrefix + 'HelloWorld');
}
```

<a name="help"></a>
## help(commandPrefix) ⇒ <code>array[array[string, string, string?]]</code>
Gets help text for the module.

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

<a name="load"></a>
## load()
Called when the all the resources for a module are loaded. Properties such as `config` may not exist until this method is called.

**Optional**  
**Kind**: API method  

<a name="unload"></a>
## unload()
When the module resources should be unloaded and timers should be cancelled - this is usually so your module can be updated or unloaded.

**Optional**  
**Kind**: API method  

<a name="config"></a>
## config ⇒ <code>Object</code>
**Kind**: Object property

Object for storing configuration data of the module within. Any property set on this object will automatically be persisted between restarts of your module.

<a name="platform"></a>
## platform ⇒ <code>Platform</code>
**Kind**: Object property

A reference to the Concierge core platform. This provides access to control methods of the bot and a means to get access directly to integration APIs. Refer to JSDoc in platform.js for details.

<a name="version"></a>
## \__version ⇒ <code>float</code>
**Kind**: Object property

The version of the module from `kassy.json`. See [Kassy.json.md#version](./Kassy.json.md#version).

<a name="coreOnly"></a>
## ~~\__coreOnly ⇒ <code>boolean</code>~~
__Deprecated__  
**Kind**: Object property

Is the module a core module, always false. Kept for backwards compatibility only.

<a name="loaderPriority"></a>
## \__loaderPriority ⇒ <code>integer</code>
**Kind**: Object property

The loading priority as an integer from `kassy.json`. See [Kassy.json.md#priority](./Kassy.json.md#priority).

<a name="folderPath"></a>
## \__folderPath ⇒ <code>string</code>
**Kind**: Object property

The folder that the module is stored within.
