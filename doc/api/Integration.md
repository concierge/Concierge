## Functions
These functions must be defined on the `exports` object within your integration.

<dl>
<dt><a href="#start">start(callback)</a></dt>
<dd><p>Starts the integration.</p></dd>
<dt><a href="#stop">stop()</a></dt>
<dd><p>Stops the integration.</p></dd>
<dt><a href="#stop">stop()</a></dt>
<dd><p>Stops the integration.</p></dd>
<dt><a href="#getApi">getApi() ⇒ <code>IntegrationApi</code></a></dt>
<dd><p>Gets the API provided by this integration.</p></dd>
</dl>

## Properties
These properties are defined on the `exports` object within your integration. They are provided by default and should not be modified unless you know what you are doing.

<dl>
<dt><a href="#config">config ⇒ <code>Object</code></a></dt>
<dd><p>Provides persistent storage for configuration.</p></dd>
<dt><a href="#platform">platform ⇒ <code>Platform</code></a></dt>
<dd><p>A reference to the Concierge core platform.</p></dd>
</dl>

<hr />

<a name="start"></a>
## start(callback)
Starts the integration.  
Until this is called, the integration should assume properties such as `config` do not exist.

**Required**  
**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function()</code> | The callback that should be executed when a message is received. It takes two parameters, api and event. See [IntegrationCreation.md#HandlingMessages](../IntegrationCreation.md#HandlingMessages) for detail. |

<a name="stop"></a>
## stop()
Stops the integration.  
This method is treated as if it is synchronous, by the time it finishes executing the module should be stopped.

**Required**  
**Kind**: API method

<a name="getApi"></a>
## getApi() ⇒ <code>IntegrationApi</code>
Gets the API provided by this integration.  
This method will only ever be called when the integration is running. See [IntegrationCreation.md#HandlingMessages](../IntegrationCreation.md#HandlingMessages) for how to create an API object.

**Required**  
**Kind**: API method  
**See**: [Concierge API](./Api.md).

<a name="config"></a>
## config ⇒ <code>Object</code>
**Kind**: Object property

Object for storing configuration data of the module within. Any property set on this object will automatically be persisted between restarts of your module.

<a name="platform"></a>
## platform ⇒ <code>Platform</code>
**Kind**: Object property

A reference to the Concierge core platform. This provides access to control methods of the bot and a means to get access directly to integration APIs. Refer to JSDoc in platform.js for details.
