node-sandbox
============

About
-----
node-sandbox is a way of running untrusted code outside of your application's node process. You can interface with code running in the sandbox via RPC (or any library that works over the node `Stream` API).

Note that at the moment, the only protection is that the code is run in a separate process, and that the process is prevented from loading certain C bindings used by core modules. In the future, there will be container plugins available to block off functionality to the process itself (eg FS access, ability to open sockets, etc.) Containment will be done on the OS-level to reduce the attack surface of the sandbox.

Note that the method of containment used by the sandbox is far from bulletproof, and there is a very real possibility that malicious code could break out of the sandbox. In the future we will be working on improving it, but it will never be perfect.

License
-------
This library is Licensed under the Academic Free License version 2.1

Documentation
=============

Using node-sandbox is pretty straightforward. The source code is fairly well documented, and there a good number of test cases, so if you have any questions, feel free to dive in!

Basic Usage
-----------

Note: by default, the code being run won't have access to `require()` or anything. See "Specifying Permissions" for more info.

```javascript
//create a new sandbox instance w/ default options
var sb = new Sandbox("./path/to/code.js");

//expose a method for the sandbox to call
sb.rpc.expose("someMethod", function(arg){
    console.log(arg);
});

//run the sandbox
sb.run();

//Wait for the sandbox to initialize.
//We can't call methods until the sandbox is ready,
//otherwise we'll get an error!
sb.on("ready", function(){
    //call a method exposed by the sandbox
    sb.rpc.call("someMethod", ["someArg"]).then(function(result){
        console.log(result);
    });
});
```

Basic Options
-------------

There are some basic options you should know about for fringe cases.

If your node command isn't in your `PATH`, you need to specify it manually. By default, it just uses `node`.

If for some reason `Sandbox` isn't detecting the path to `shovel.js`, you can specify the path manually (it's in `node-sandbox/lib/shovel.js`)

```javascript
var sb = new Sandbox("path/to/code.js", {
    
    //the node command used to spawn the child process
    node_command: "node"

    //the path to the shovel (what bootstraps the child process)
    shovel: path.join(__dirname, "shovel.js"),

});
```

Other options are discussed in the relevant sections!

Specifying Permissions
----------------------

Specifying permissions is somewhat complicated. In node, there's a function called `process.binding()` that's used by node's built-in modules to get the relevant C bindings for things like I/O, crypto, and others. `process.binding()` works like `require()` does; you pass a module as an argument, and it fetches the relevant C binding.

node-sandbox's permissions system will block off loading of the C bindings. To allow loading of them, we need to pass a `permissions` option to it, specifying which C bindings are allowed to be loaded.

The following are the permissions specified by default, and are needed for the sandbox to run.

```javascript
var sb = new Sandbox("./path/to/code.js", {
    permissions: ["tty_wrap", "pipe_wrap"]
});
```

If you want to allow use of specific modules (eg `fs` or `crypto`), look at their file in [node's `lib/` directory](https://github.com/joyent/node/tree/master/lib), and see what bindings they load by searching for `process.binding`. Then pass any modules needed through `permissions` array.

Note that if you want access to `require()`, you'll need to pass the following to permissions:

```javascript
var sb = new Sandbox("./path/to/code.js", {
    permissions: ["tty_wrap", "pipe_wrap"] //TODO: figure these out
});
```

Exposing RPC Methods
--------------------
node-sandbox comes with a stock RPC library that uses JSON-RPC in a bi-directional way, so that both ends can expose methods for the other to call. We can access it through `Sandbox.rpc`.

Exposing methods in the main process is easy:

```javascript
var sb = new Sandbox(/* options etc */);
sb.run();

//we can expose individual methods, eg:
sb.rpc.expose("addOne", function(arg){
    return arg+1;
});

//we can create namespaces by including a '.'
sb.rpc.expose("myNamespace.someMethod", function(){
    return true;
});

//we can unexpose methods like this!
sb.rpc.unexpose("myNamespace.someMethod");

//alternatively, we can opt to expose an entire object.
//This deletes anything that was already exposed previously.
sb.rpc.exposeObject({
    addOne: function(arg){
        return arg+1;
    },
    myNamespace: {
        someMethod: function(){ return true; }
    }
});

//unexposing still works the same way when
//using exposeObject
sb.rpc.unexpose("myNamespace.someMethod");
```

If you need to work with asynchronous libraries in the methods you expose, you can return a `Promise` object instead. You can use any `Promise` library you like, but I use [Kris Zyp's node-promise](https://github.com/kriszyp/node-promise).

```javascript
sb.rpc.expose("asyncMethod", function(){
    var p = new Promise();

    setTimeout(function(){
        p.callback("Success!");
        //or
        p.errback("Failure!");
    }, 2000);

    return p;
});
```

Exposing methods within the sandbox works the same way, except we use the global `rpc` variable instead of `Sandbox.rpc`. Inside the sandbox, `Promise` is accessible globally for convenience.

```javascript
rpc.expose("myMethod", function(){
    var p = new Promise();
    // etc. etc.
    return p;
});
```

Calling RPC Methods
-------------------

To call methods, you can use `Sandbox.rpc.call`, or `Sandbox.rpc.notify`. Both methods will call the remote method, but `call` will give you a return value, while `notify` won't (see the JSON-RPC docs if this is confusing).

It's important to note that you can't call methods until after `Sandbox` has emitted a `ready` event! See the "Basic Usage" code snippet for an example.

`call` will return a `Promise` object to give you the result asynchronously. See the docs for [Kris Zyp's node-promise](https://github.com/kriszyp/node-promise) for all available methods.

```javascript
//this will call the method like so: myMethod(1, 2, 3);
sb.rpc.call("myMethod", [1, 2, 3]).then(
    function(result){
        console.log("Success! "+result);
    },
    function(error){
        console.log("We got an error: "+error.message);
    }
);

//if we pass call() an object as arguments, it'll call the method like this: myMethod(myObj);
var myObj = {foo: "bar"};
sb.rpc.call("myMethod", myObj);


//here's an example using notify(). It's arguments are identical to call()
sb.rpc.notify("myMethod", [1, 2, 3]); //no returned value
```

Again, the API is identical from within the sandbox. Just use the `rpc` global variable instead of `Sandbox.rpc`

```javascript
rpc.call("myMethod", [1, 2, 3]);
```

RPC Call Timeouts
-----------------

Sometimes, we might want to specify a timeout for method calls, just in case. We can do this one of two ways.

The first is to use the `Promise` api:

```javascript
var p = rpc.call("myMethod", [1, 2, 3]);
p.timeout(10000); //timeout after 10 seconds
p.then(/* ... */);
```

The second is to add an additional `call_timeout` option, eg:

```javascript
var sb = new Sandbox("path/to/code.js", {
    call_timeout: 10000 //10 seconds
});
```

By default, `call_timeout` is `-1`, which disables timeouts to method calls. The value specified in `call_timeout` will also be applied to the `rpc` class inside the sandbox.

Detecting when the sandbox exits
--------------------------------

We can detect when the sandbox exits using the `exit` event.

```javascript
sb.on("exit", function(){
    console.log("the sandbox ended!");
});
```

Lockup detection & killing the sandbox
--------------------------------------
node-sandbox has built in lockup detection, so if a stray `while()` loop locks up the sandbox, we can react to it.

To kill the sandbox, we can use `Sandbox.kill()`.

```javascript
var sb = new Sandbox("path/to/code.js", {
    permissions: [/*...*/],
    
    //Here are some relevant options for lockup detection.
    //All time is specified in milliseconds.
    //Set any of these values to -1 to disable them.

    //how long we should wait for a reply
    //before emitting a 'lockup' event. (default: 10 seconds)
    lockup_timeout: 10000,
    
    //how long we should wait after killing the process
    //to kill -9 it. (default: 10 seconds)
    kill_with_fire_timeout: 10000,
    
    //how frequently we should check the sandbox (default: 10 seconds)
    ping_interval: 10000,
    
    //how long we should wait before assuming
    //the sandbox failed to start (locked up immediately)
    //(default: 10 seconds)
    startup_timeout: 10000,

});

sb.run();

sb.on("lockup", function(){
    //restart the sandbox
    sb.kill();
    sb.run();
});
```

Detecting output on STDERR
--------------------------

If something ever goes wrong within the sandbox, by default it doesn't get printed to the main process' `STDOUT`. Instead, you need to listen on the `stderr` event and do it yourself, eg:

```javascript
sb.on("stderr", function(text){
    console.err(text);
});
```

You can also pass this on to any logging library you use.

Pinging the Sandbox
-------------------

If you want to ping the sandbox to figure out latency, you can use `Sandbox.ping()`, which returns a `Promise` object.

```javascript
sb.ping().then(function(time){
    console.log("Sandbox latency: "+time);
}, function(err){
    console.log("Failed to ping sandbox!");
});
```
Plugins
-------

node-sandbox has a full featured plugin system, and a lot of it's features are provided by built-in plugins. Built-in plugins can be found in `lib/plugins/`, and include the following:

* `_base`: not meant to be loaded, but provides base functionality to other plugins
* `rpc`: provides JSON-RPC functionality (exposed through `Sandbox.rpc`) over the `Stream` between the parent and child processes exposed by `Sandbox`.
* `lockup_detection`: provides lockup detection functionality, including the `on("lockup")` event. Relies on `rpc`.
* `wrapper`: wraps `process.binding` so that any unauthorized modules aren't allowed to be loaded.

Eventually I'd like to include a plugin that can set up a secure container for the child process using OS features (eg SELinux). If you know a lot about this sort of thing and would like to contribute, please let me know!

Plugins can be specified using the `plugins` option:

```javascript
var sb = new Sandbox("path/to/file.js", {
    plugins: [
        //Note: these are the default plugins that are loaded. If you want to load an extra plugin, you should include these built-in ones too!
        "rpc", "lockup_detection", "wrapper"
    ]
});
```

Note that plugin hooks are executed in the order that they're provided in the array, so make sure "wrapper" goes last, otherwise a plugin might not have access to the resources it needs to initiate itself!

Some plugins in the future may take additional arguments, but all the built-in ones at the time of writing read from the main arguments passed to the sandbox (for the sake of ease-of-use). Here's an example on how to pass custom arguments to a plugin:

```javascript
var sb = new Sandbox("path/to/file.js", {
    plugins: [
        {
            name: "my_plugin",
            options: {foo: "bar"}
        },
        "some_other_plugin"
    ]
});
```

To load an external plugin, simply pass a path to the directory containing all the plugin's files (`manifest.js`, etc.) instead of a plugin name. It can either be an absolute path, or relative to the `lib/PluginManager.js` file:

```javascript
var sb = new Sandbox("path/to/file.js", {
    plugins: [
        {
            name: "/path/to/my_plugin",
            options: {foo: "bar"}
        },
        //OR
        "/path/to/my_plugin"
    ]
});
```

Writing Custom Plugins
----------------------

The plugin system lets you hook into the sandbox and add any functionality you want. Things you can do include:

* Extend the sandbox by adding custom options and methods, and pretty much override/wrap any function/variable you want
* Run code during certain events in the parent process (eg when the child process exits, when the process writes to stderr, etc.)
* Run code inside the child process (eg when the process spawns, after the code is loaded, after the code is executed, etc.)
* Pass extra arguments to the child process via `startData`

Using this, you can write your own RPC plugin, container plugin, or anything else you need. I strongly suggest looking in the `lib/plugins` directory for examples, especially at the `_base` plugin, which documents when each hook is called.

Plugins consist of three files:

* `plugin_name/manifest.js`: a manifest file that provides information about the plugin.
* `plugin_name/ParentHooks.js`: a class that provides hooks for the parent process and allows you to hook into each `Sandbox` instance.
* `plugin_name/ShovelHooks.js`: a class that provides hooks for `shovel.js`, which is what's run to create our child process.

`ParentHooks` and `ShovelHooks` should both extend the respective classes in the `_base` plugin. `manifest.js` can simply be copied to your plugin's directory.

The `PluginManager` class loads the plugins, and does some basic dependency/conflict checks. Below is the `manifest.js` file from the `_base` plugin:

```javascript
module.exports = {
    name: "_base", //the name of the parent directory our plugin is in
    provides: [], //features that it provides. This is flexible, so it can be something like "container" or "rpc".
    conflicts: [], //features or specific plugins this plugin conflicts with.
    depends: [] //features or specific plugins that this plugin requires to run.
}
```

To put this into practice, lets say we want to write a replacement for the RPC plugin. If we put `"rpc"` in the `provides` array, the plugin manager will throw an error if any other plugins that provide the `"rpc"` functionality are loaded. This way two plugins won't fight over access to `Sandbox.rpc`.

If we don't provide RPC functionality, but for one reason or the other we conflict with the RPC module (maybe our plugin wants to use the `Stream` between parent and child processes exclusively), we can put it in the `conflicts` array instead.

If our plugin depended on the RPC class in order to pass data between the parent and child processes, we could put `"rpc"` in the `depends` array. Note that any plugin that provides the `"rpc"` functionality would satisfy this requirement. For this reason, it's strongly suggested that any module that provides a specified functionality should have an identical base API (extra functions are allowed to be implemented).

To implement subclasses of `ParentHooks` and `ShovelHooks`, take a look inside of the respective class definitions in the `_base` class. Everything is well documented in there, and will explain how to access things through member variables, and which methods get called when.
