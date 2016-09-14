# `kassy.json`
`kassy.json` describes to Concierge how to load your (Kassy module format) module.

**Note**
- Many properties within `kassy.json` should not be used if the equivilent method has been implemented within your module.
- Only the properties marked <code>required</code> must be present (except where affected by previous note), all others are optional.

**Example**
This is a basic example of a module named `foo`.
```json
{
	"name": "foo",
	"version": 1.0,
	"startup": "foo.js",
	"command": "foo",
	"help": [
		["{{commandPrefix}}foo", "A basic module example for kassy.json"]
	]
}
```

## Properties

<dl>
<dt><a href="#name">name</a></dt>
<dd><p>The name of the module.</p>
</dd>

<dt><a href="#version">version</a></dt>
<dd><p>The version of the module.</p>
</dd>

<dt><a href="#startup">startup</a></dt>
<dd><p>The file that is the entry point for the module.</p>
</dd>

<dt><a href="#command">command</a></dt>
<dd><p>The string that each command to the module should be prefixed with.</p>
</dd>

<dt><a href="#help">help</a></dt>
<dd><p>Help text associated with this module.</p>
</dd>

<dt><a href="#priority">priority</a></dt>
<dd><p>Where in the execution order of modules to execute this module.</p>
</dd>

<hr />

<a name="name"></a>
## name ⇒ <code>string</code>
**Required**  
**Kind**: Object property

The name of the module.
Where possible this string should be unique to prevent problems installing and running other modules with the same name.

<a name="version"></a>
## version ⇒ <code>float</code>
**Required**  
**Kind**: Object property

The version of the module.
While not absolutely nessecery, it is recommended that this value is updated every time a change is made to your module so your users are aware that they no longer have the latest version.

<a name="startup"></a>
## startup ⇒ <code>string</code>
**Required**  
**Kind**: Object property

The file that is the entry point for the module.
Usually this file will be a JavaScript file located in the same directory as the `kassy.json` file.

<a name="command"></a>
## command ⇒ <code>string</code>
**Required** if and only if `exports.match` has not been provided within your module. See [Module.md#match](./Module.md#match).  
**Kind**: Object property

The string that each command to the module should be prefixed with.
Where possible this string should be unique to prevent problems installing and running other modules with the same name.

**Example**
If command was set to `foo` and the `commandPrefix` (see [Api.md#commandPrefix](./Api.md#commandPrefix)) was set to `/`, then:

|User Input|Would Execute The Module|
|---|---|
|foo|No|
|/foo|Yes|
|/foo bar baz|Yes|
|foo bar baz|No|
|foo /foo bar|No|

This is the equivilent of the regular expression: `/^\/foo(?=($|\s))/`.

<a name="help"></a>
## help ⇒ <code>array[array[string, string, string?]]</code>
**Optional** should not be provided if `exports.help` has has been implemented. See [Module.md#help](./Module.md#help).  
**Kind**: Object property

Help text associated with this module.
This consists of multiple arrays, each inner array represents one entry in the Concierge help system. Each entry takes the format: `['CommandString/Example', 'ShortDescription', 'OptionalLongDescription']`. As is suggested by the word 'Optional', the last element of this array does not need to be provided (but is highly recommended).

The any string within an entry can contain the special substring `{{commandPrefix}}` which will be replaced with the appropriate string when help is displayed. Displayed help can also be translated, this is done by using the help strings within `kassy.json` as keys, which then can be looked up within the built in translation service.

<a name="priority"></a>
## priority ⇒ <code>string</code> | <code>integer</code>
**Optional**  
**Kind**: Object property

Where in the execution order of modules to execute this module. Lower numbers have higher priority.

|Value|Affect|
|---|---|
|Any Integer|Will execute modules in acending order of integer value.|
|`"first"`|Equivilent of `Number.MIN_VALUE`|
|`"last"`|Equivilent of `Number.MAX_VALUE`|
|`"normal"`|Equivilent of `0`|
|Not Provided|Equivilent of `0`|
