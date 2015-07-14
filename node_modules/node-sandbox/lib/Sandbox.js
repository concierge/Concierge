var Duplex = require("./rpc/Duplex");
var NamespaceWrapper = require("./rpc/NamespaceWrapper");
var DuplexStream = require("./DuplexStream");
var PluginManager = require("./PluginManager");
var EventEmitter = require('events').EventEmitter;
var util = require("util");
var _ = require('underscore/underscore');
var Promise = require("node-promise/promise").Promise;

var path = require('path');
var child_process = require('child_process');

//the default options for the sandbox.
var default_options = {
    //the path to the shovel (what bootstraps the child process)
    shovel: path.join(__dirname, "shovel.js"),
    //the node command used to spawn the child process
    node_command: "node",
    //how long we should wait for a reply
    //before emitting a 'lockup' event.
    lockup_timeout: 10000,
    //how long we should wait after killing the process
    //to kill -9 it.
    kill_with_fire_timeout: 10000,
    //the interval we should use to send pings.
    ping_interval: 10000,
    //how long we should wait before assuming
    //the sandbox failed to start (locked up)
    startup_timeout: 10000,
    //method call timeout (passed to RPC)
    call_timeout: -1,
    //which modules we're allowed to import inside the sandbox
    permissions: ["tty_wrap", "pipe_wrap"],
    //the path to our plugins dir. No trailing slash.
    //This is relative to the `PluginManager.js` file.
    plugins_dir: "./plugins",
    //the plugins to load. See the default plugins dir for more info.
    //to pass options to a plugin, pass an object instead of a string, eg:
    //{name: "foo", options: {/* whatever you want */}}
    plugins: [
        "rpc", "lockup_detection", "wrapper"
    ]
}

var Sandbox = module.exports = function(/*String*/path, /*Object*/options){
    EventEmitter.call(this);
    
    //store arguments
    this._path = path;
    if(!options) options = {};
    this._options = _.defaults(options, default_options);

    this._process = null;

    this._pluginManager = new PluginManager(this._options.plugins, "ParentHooks", this._options.plugins_dir, this);
}

util.inherits(Sandbox, EventEmitter);


//runs the sandbox.
Sandbox.prototype.run = function(){
    var self = this;

    var startOptions = {
        path: this._path,
        plugins_dir: this._options.plugins_dir,
        plugins: this._getPluginsForChildProcess()
    };

    //start the child node process and pass startOptions via it's arguments
    var cprocess = this._process = child_process.spawn(this._options.node_command, [
        this._options.shovel,
        JSON.stringify(startOptions)
    ]);
    
    this._pluginManager.call("spawn", [cprocess]);
    
    //set up stderr handling on the child process
    this._setupStderrEmit();

    //set up the exit event for when the process dies
    cprocess.on("exit", _.bind(this._onExit, this));

}

Sandbox.prototype._getPluginsForChildProcess = function(){
    var list = [];
    var startData = this._pluginManager.get("startData");
    for(var i in startData){
        list.push({name: i, options: startData[i]});
    }
    return list;
}

//gets the stream for use with communication with the sandbox
Sandbox.prototype.getStream = function(){
    if(!this._process)
        throw new Error("Tried to get the stream while the sandbox isn't running!");

    return new DuplexStream(this._process.stdout, this._process.stdin);
}

//called once the child process ends.
Sandbox.prototype._onExit = function(code, signal){
    this._pluginManager.call("exit", [code, signal]);
    this._process = null;
    this.emit("exit");
}

//sets up the process so that when it writes to stderr,
//the Sandbox emits an stderr event.
Sandbox.prototype._setupStderrEmit = function(){
    this._process.stderr.on("data", _.bind(function(data){
        this._pluginManager.call("error", [data]);
        this.emit("stderr", data)
    }, this));
}

//kills the child process spawned by the sandbox.
//If necessary, it kills it with fire.
Sandbox.prototype.kill = function(){
    if(!this._process)
        throw Error("Tried to kill Sandbox while not running!");
    
    this._pluginManager.call("kill");
    
    this._process.kill();
 
    //if we pass a timeout, kill it with fire (SIGKILL)
    var self = this;
    if(this._options.kill_with_fire_timeout > 0)
        setTimeout(function(){
            if(self._process && !self._process.killed)
                self._process.kill('SIGKILL');
        }, this._options.kill_with_fire_timeout);
}

