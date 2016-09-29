## Functions

<dl>
<dt><a href="#sendMessage">sendMessage(message, thread)</a></dt>
<dd><p>Send a message to a chat.</p>
</dd>
<dt><a href="#sendUrl">sendUrl(url, thread)</a></dt>
<dd><p>Embeds a URL within a chat.</p>
</dd>
<dt><a href="#sendImage">sendImage(type, image, description, thread)</a></dt>
<dd><p>Send an image to a chat.</p>
</dd>
<dt><a href="#sendFile">sendFile(type, file, description, thread)</a></dt>
<dd><p>Send a file to a chat.</p>
</dd>
<dt><a href="#sendTyping">sendTyping(thread)</a></dt>
<dd><p>Starts the self-cancelling typing indicator.</p>
</dd>
<dt><a href="#setTitle">setTitle(title, thread)</a></dt>
<dd><p>Sets the title of a chat thread.</p>
</dd>
<dt><a href="#sendPrivateMessage">sendPrivateMessage(message, thread)</a></dt>
<dd><p>Sends a private message to a person.</p>
</dd>
<dt><a href="#sendMessageToMultiple">sendMessageToMultiple(message, threads)</a></dt>
<dd><p>Sends a message to mutiple loaded integrations.</p>
</dd>
<dt><a href="#getUsers">getUsers(thread)</a> ⇒ <code>Object</code></dt>
<dd><p>Gets the users within a thread.</p>
</dd>
<dt><a href="#random">random(arr)</a> ⇒ <code>Object</code></dt>
<dd><p>Convenience method for selecting random items from an array.</p>
</dd>
<dt><a href="#http">http()</a> ⇒ <code>Object</code></dt>
<dd><p>Convenience method for performing http requests.</p>
</dd>
</dl>

## Properties

<dl>
<dt><a href="#commandPrefix">commandPrefix</a></dt>
<dd><p>The prefix that should be used before commands on the current integration.</p>
</dd>
</dl>

<hr />

<a name="sendMessage"></a>

## sendMessage(message, thread)
Send a message to a chat.

**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | the message to send. |
| thread | <code>string</code> | the ID of the thread to send the message to. |

**Example**  
To send 'Hello World' to the current thread:
```js
api.sendMessage('Hello World', event.thread_id);
```
<a name="sendUrl"></a>

## sendUrl(url, thread)
Embeds a URL within a chat.

**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | the url to embed. |
| thread | <code>string</code> | the ID of the thread to embed the url in. |

**Example**  
To send 'http://google.com' to the current thread:
```js
api.sendUrl('http://google.com', event.thread_id);
```
<a name="sendImage"></a>

## sendImage(type, image, description, thread)
Send an image to a chat.

**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | type of image that is being sent. By default this can be 'url' or 'file' although individual integrations can expand support to other types. |
| image | <code>string</code> &#124; <code>Object</code> | image object for the type provided. |
| description | <code>string</code> | description of the image being sent. |
| thread | <code>string</code> | the ID of the thread to send the image to. |

**Example**  
To send the image 'http://i.imgur.com/unrseYB.png' to the current thread with the description 'Hello World':
```js
api.sendImage('url', 'http://i.imgur.com/unrseYB.png', 'Hello World', event.thread_id);
```
<a name="sendFile"></a>

## sendFile(type, file, description, thread)
Send a file to a chat.

**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | type of file that is being sent. By default this can be 'url' or 'file' although individual integrations can expand support to other types. |
| file | <code>string</code> &#124; <code>Object</code> | file object for the type provided. |
| description | <code>string</code> | description of the file being sent. |
| thread | <code>string</code> | the ID of the thread to send the file to. |

<a name="sendTyping"></a>

## sendTyping(thread)
Starts the self-cancelling typing indicator.

**Note**:  
Typing indicators are self-cancelling; that is, when this method is called the integration should work out for itself when to stop the typing indicator. It is automatically called when a module is invoked.

**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| thread | <code>string</code> | the thread ID of the thread to send the typing indicator to. |

**Example**  
To start the typing indicator in the current thread:
```js
api.sendTyping(event.thread_id);
```
<a name="setTitle"></a>

## setTitle(title, thread)
Sets the title of a chat thread.

**Kind**: API method

| Param | Type | Description |
| --- | --- | --- |
| title | <code>string</code> | the new title of the thread. |
| thread | <code>string</code> | the thread ID of the thread to set the title of. |

**Example**  
To set the title of the current thread to 'Hello World':
```js
api.setTitle('Hello World', event.thread_id);
```
<a name="sendPrivateMessage"></a>

## sendPrivateMessage(message, thread)
Sends a private message to a person.

**Kind**: API method  
**See**: [sendMessage](#sendMessage)

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | message to send. |
| thread | <code>string</code> | the ID of the person to send the message to. |

<a name="sendMessageToMultiple"></a>

## sendMessageToMultiple(message, threads)
Sends a message to multiple loaded integrations.

**Kind**: API method  
**Note**: Integration authors should NOT implement this method.

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | message to send. |
| threads | <code>Object</code> | object representing the threads to send the message to. |

**Example**  
For example, to send the message "Hello World!" to the Facebook threads 1234 and 5678 as well as the Slack threads 'abcd' and 'efgh':
```js
api.sendMessageToMultiple("Hello World!", {
    "facebook": [1234, 5678],
    "slack": ['abcd', 'efgh']
});
```
<a name="getUsers"></a>

## getUsers(thread) ⇒ <code>Object</code>
Gets the users within a thread.

**Kind**: API method  
**Returns**: <code>Object</code> - an object similar to the example below.

| Param | Type | Description |
| --- | --- | --- |
| thread | <code>string</code> | thread to get the users of. |

**Example**
```js
{
    '<someUserId>': {
        name: '<someUserName>'
    }
}
```

<a name="random"></a>

## random(arr) ⇒ <code>Object</code>
Convenience method for selecting random items from an array.

**Kind**: API method  
**Note**: Integration authors should NOT implement this method.  
**Returns**: <code>Object</code> - random item of the array.  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>Array</code> | array to select a random item from. |

**Example**
```js
let array = ['foo', 'bar', 'baz'];
let randomItem = api.random(array); // foo, bar or baz
```
<a name="http"></a>

## http() ⇒ <code>Object</code>
Convenience method for performing http requests.

**Kind**: API method  
**Note**: Integration authors should NOT implement this method.  
**Returns**: <code>Object</code> - an `http.clientRequest`.  
**See**: [https://github.com/technoweenie/node-scoped-http-client](https://github.com/technoweenie/node-scoped-http-client), `client.create` for API details.

<a name="commandPrefix"></a>
## commandPrefix ⇒ <code>string</code>
The prefix that should be used before commands on the current integration.  
Using the prefix is optional but highly recommended within your commands.

**Kind**: Object property  
**Example**  
If the command prefix was `/`, and you had a command `foo`, then to activate your command the following should be required:
```
/foo
```
