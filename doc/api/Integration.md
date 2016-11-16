# Integration
An integration is Concierges way of interacting with different chat platforms. For example, amoungst others, there are Facebook, Skype and Test integrations.

## Functions
These functions must be defined on the `exports` object within your integration.

<dl>
<dt><a href="#start">start(callback)</a></dt>
<dd><p>Starts the integration.</p></dd>
<dt><a href="#stop">stop()</a></dt>
<dd><p>Stops the integration.</p></dd>
<dt><a href="#getApi">getApi() ⇒ <code>IntegrationApi</code></a></dt>
<dd><p>Gets the API provided by this integration.</p></dd>
</dl>

## Properties
All properties avalible to a module are also set on a service. *See [Modules](./Module.md)*. Additionally, if not set, within the `config` property a `commandPrefix` string will be set by default.

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
This method is treated as if it is synchronous, by the time it finishes executing the integration should be stopped.

**Required**
**Kind**: API method

<a name="getApi"></a>
## getApi() ⇒ <code>IntegrationApi</code>
Gets the API provided by this integration.
This method will only ever be called when the integration is running. See [IntegrationCreation.md#HandlingMessages](../IntegrationCreation.md#HandlingMessages) for how to create an API object.

**Required**
**Kind**: API method
**See**: [Concierge API](./Api.md).
