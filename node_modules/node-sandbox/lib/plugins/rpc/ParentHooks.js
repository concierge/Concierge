var Duplex = require("../../rpc/Duplex");
var DuplexStream = require("../../DuplexStream");
var NamespaceWrapper = require("../../rpc/NamespaceWrapper");
var util = require("util");
var BaseParentHooks = require("../_base/ParentHooks");

var ParentHooks = module.exports = function(){
    BaseParentHooks.apply(this, arguments);
    this.rpc = null;

    this.startData = {
        call_timeout: this._sandbox._options.call_timeout
    }
}

util.inherits(ParentHooks, BaseParentHooks);

ParentHooks.prototype.onSpawn = function(proc){
    //create the RPC class
    var rpc = this.rpc = new Duplex(new DuplexStream(proc.stdout, proc.stdin), {
        call_timeout: this._options.call_timeout
    });
    
    //expose a 'rpc.ready' method that the sandbox can call when it's initialized
    var self = this;
    rpc.expose("rpc.ready", function(){
        self._sandbox.emit("ready");
    });

    //expose the RPC class for general use (wrap it so it uses it's own namespace)
    this._sandbox.rpc = new NamespaceWrapper(rpc, "sandbox");

}
