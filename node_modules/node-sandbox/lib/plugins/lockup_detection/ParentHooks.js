var Duplex = require("../../rpc/Duplex");
var DuplexStream = require("../../DuplexStream");
var NamespaceWrapper = require("../../rpc/NamespaceWrapper");
var Promise = require("node-promise/promise").Promise
var util = require("util");
var BaseParentHooks = require("../_base/ParentHooks");

var ParentHooks = module.exports = function(){
    BaseParentHooks.apply(this, arguments);

    this._pingInterval = null;
    this._startupTimer = null;

    this.isRunning = false;

    var self = this;
    this._sandbox.on("ready", function(){
        self.isRunning = true;
        //clear the startup timeout (see below)
        clearTimeout(self._startupTimer);
    });

    //expose the ping method to the sandbox
    this._sandbox.ping = function(){
        self.ping.apply(self, arguments);
    }

}

util.inherits(ParentHooks, BaseParentHooks);

ParentHooks.prototype.onSpawn = function(){
    //if 'rpc.ready' wasn't called after the startup timeout,
    //emit a lockup event
    var self = this;
    this._startupTimer = setTimeout(function(){
        if(!self.isRunning){
            //since the process is probably running,
            //but is locked up, we'll set this to true
            self.isRunning = true;
            self._sandbox.emit("lockup", new Error("Lockup detected"));
        }
    }, this._sandbox._options.startup_timeout);

    //set up ping interval
    if(this._sandbox._options.ping_interval > 0)
        this._setupPingInterval();
}

ParentHooks.prototype.onExit = function(){
    this.isRunning = false;
    this._stopPingInterval();
}

//ping the sandbox to see if it's still alive.
ParentHooks.prototype.ping = function(){
    if(!this.isRunning)
        throw Error("Tried to ping Sandbox while not running!");

    var rpc = this._manager.plugins.rpc.rpc;

    var p = new Promise();
    var start = new Date();
    rpc.call("rpc.ping").then(function(){
        var end = new Date();
        var delta = end.getTime() - start.getTime();
        p.callback(delta);
    }, function(e){
        p.errback(e);
    });

    //timeout after the interval specified in _options
    if(this._sandbox._options.lockup_timeout > 0)
        p.timeout(this._sandbox._options.lockup_timeout);
    return p;
}

//sets up automatic pinging, which will cause the class
//to emit 'ping' and 'lockup' events when the sandbox is
//pinged and when it locks up, respectively.
ParentHooks.prototype._setupPingInterval = function(){
    var self = this;

    this._pingInterval = setInterval(function(){
        if(!self.isRunning) return;

        self.ping().then(function(time){
            self._sandbox.emit("ping", time);
        }, function(){
            if(self.isRunning)
                self._sandbox.emit("lockup", new Error("Lockup detected"));
        })
        
    }, this._sandbox._options.ping_interval)
};

ParentHooks.prototype._stopPingInterval = function(){
    clearInterval(this._pingInterval);
};
