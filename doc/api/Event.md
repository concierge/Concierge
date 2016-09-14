## Properties

<dl>
<dt><a href="#thread_id">thread_id</a></dt>
<dd><p>Unique ID of the thread that received this event.</p>
</dd>
<dt><a href="#sender_id">sender_id</a></dt>
<dd><p>Unique ID of the sender who sent the message that this event represents.</p>
</dd>
<dt><a href="#sender_name">sender_name</a></dt>
<dd><p>Name of the sender who sent the message that this event represents.</p>
</dd>
<dt><a href="#body">body</a></dt>
<dd><p>The full text of the message that has been received.</p>
</dd>
<dt><a href="#event_source">event_source</a></dt>
<dd><p>The name of the integration that sent this message.</p>
</dd>
<dt><a href="#arguments">arguments</a></dt>
<dd><p>Arguments split up as they would be if they were being passed from a command line interpreter.</p>
</dd>
<dt><a href="#arguments_body">arguments_body</a></dt>
<dd><p>Same as body, except excludes the first element of arguments.</p>
</dd>
</dl>

<hr />

<a name="thread_id"></a>
## thread_id ⇒ <code>string</code>
**Kind**: Object property

Unique ID of the thread that received this event.  
The formatting of this string is not guaranteed, and will be specific to each integration. It is only guaranteed to be specific within an integration.

<a name="sender_id"></a>
## sender_id ⇒ <code>string</code>
**Kind**: Object property

Unique ID of the sender who sent the message that this event represents.  
The formatting of this string is not guaranteed, and will be specific to each integration. It is only guaranteed to be specific within an integration.

<a name="sender_name"></a>
## sender_name ⇒ <code>string</code>
**Kind**: Object property  
**See**: [Api.md#getUsers](./Api.md#getUsers), `api.getUsers` for further details on users.

Name of the sender who sent the message that this event represents. This is very unlikely to be unique, and in the case of some integrations will only be a nickname or username. If an integration provides additional detail about a user, this should be provided via the `api.getUsers` method.

<a name="body"></a>
## body ⇒ <code>string</code>
**Kind**: Object property

The full text of the message that has been received.

<a name="event_source"></a>
## event_source ⇒ <code>string</code>
**Kind**: Object property

The name of the integration that sent this message.

<a name="arguments"></a>
## arguments ⇒ <code>Array</code>
**Kind**: Object property  
**See**: [body](#body)

The body split up into arguments as they would be if they were being passed from a command line interpreter. This means that the body is split on spaces, except where enclosed in double quotes that have not been escaped.

**Example**  
```
'/foo bar hello world'     ⇒ ["/foo", "bar", "hello", "world"]
'/foo bar "hello world"'   ⇒ ["/foo", "bar", "hello world"]
'/foo bar \"hello world\"' ⇒ ["/foo", "bar", "hello", "world"]
```

<a name="arguments_body"></a>
## arguments_body ⇒ <code>string</code>
**Kind**: Object property  
**See**: [body](#body)  
**See**: [arguments](#arguments)

Same as body, except excludes the first element of arguments.

**Example**  
If the body text was:
```
/foo bar hello world
```
`arguments_body` would be:
```
bar hello world
```
