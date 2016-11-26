# Service
A Concierge service is a module that can only be loaded or unloaded. It does not get called when messages are sent (although it is possible to listen for these using events). A service **MUST** cleanup after itself, in order to prevent memory leaks.

## Functions
These functions must be implemented within a service (or optionally within a module) as a part of the `exports` object.

<dl>
<dt><a href="#load">load()</a></dt>
<dd><p>Called when the all the resources for a module are loaded.</p></dd>
<dt><a href="#unload">unload()</a></dt>
<dd><p>Called when the module resources should be unloaded and timers should be cancelled.</p></dd>
</dl>

## Properties
All properties avalible to a module are also set on a service. *See [Modules](./Module.md)*.

<hr />

<a name="load"></a>
## load()
Called when the all the resources for a module are loaded. Properties such as `config` may not exist until this method is called.

**This Context**: Service Object
**Kind**: API method

<a name="unload"></a>
## unload()
When the module resources should be unloaded and timers should be cancelled - this is usually so your module can be updated or unloaded.

**This Context**: Service Object
**Kind**: API method
