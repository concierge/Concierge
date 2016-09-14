Concierge provides a built in translation service for its modules. This service is exposed via the `$$` object, a [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals) which can be used to translate any literal automatically. The locale of Concierge can be set via the command-line, configuration files or manually within code.

Translation files are stored as json dictionaries within the `i18n` subdirectory of a module. The name of the `.json` file is the code for the translation (e.g. `en.json` is the translations for the `en` code). Translations are loaded automatically based on the set locale and are specific to each module.

**Example**  
Within code:  
```js
api.sendMessage($$`Example Key ${exampleValue}`, event.thread_id);
```

The `i18n/foo.json` file:
```json
{
    "Example Key ${0}": "Some example translation of example key, that embeds the value, ${0}"
}
```

## Functions
All of these methods are available for use on the `$$` object, which is available globally.

<dl>
<dt><a href="#translate">translate(strings, values, context) ⇒ <code>string</code></a></dt>
<dd>
    <p>Translates a given format string with context.</p>
    <p><i>Automatically aliased as a tagged template literal available via `$$`.</i></p>
</dd>
<dt><a href="#hook">hook(func, context = null)</a></dt>
<dd><p>Provides a means to override the translation.</p></dd>
<dt><a href="#setLocale">setLocale(localeString)</a></dt>
<dd><p>Sets the current locale of the system.</p></dd>
<dt><a href="#getLocale">getLocale() ⇒ <code>string</code></a></dt>
<dd><p>Gets the current locale of the system.</p></dd>
<dt><a href="#removeContextIfExists">removeContextIfExists(context)</a></dt>
<dd><p>Removes a translation context if that context exists.</p></dd>
</dl>
<hr />

<a name="translate"></a>
## translate(strings, values, context) ⇒ <code>string</code>
Translates a given format string with context.  
This method is automatically aliased as a tagged template literal available via `$$`. When called via `$$`, the `context` parameter will be resolved based on the current caller.

**Kind**: API method  
**Returns**: the translated string.

| Param | Type | Description |
| --- | --- | --- |
| strings | <code>Array<string></code> | input format string split at format values. These are the sections outside of the `${x}` sections of the format string. |
| values | <code>Array<string></code> | input format values. These are the values of strings contained within `${x}` sections of the format string. |
| context | <code>string</code> | the context in which to translate. This is unique to each module. |

<a name="hook"></a>
## hook(func, context = null)
Provides a means to override the translation.

**Kind**: API method  
**See**: [MDN: Tagged Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals).

| Param | Type | Description |
| --- | --- | --- |
| func | <code>function()</code> | a function that will receive a tagged template literal. |
| context | <code>string</code> | the translation context. Either the module name or global context identifier. This parameter is optional, if not provided (`null`) will default to the current context. |

<a name="setLocale"></a>
## setLocale(localeString)
Sets the current locale of the system.

**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| localeString | <code>string</code> | the string to set the locale to. E.g. `en` for English. |

<a name="getLocale"></a>
## getLocale() ⇒ <code>string</code>
Gets the current locale of the translation system.

**Kind**: API method  
**Returns**: locale string. E.g. `en` for English.

<a name="removeContextIfExists"></a>
## removeContextIfExists(context)
Removes a translation context if that context exists.    
Has no limitations, so has the ability to remove the global context as well... (be careful).

**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| context | <code>string</code> | the translation context. Either the module name or global context identifier. |
