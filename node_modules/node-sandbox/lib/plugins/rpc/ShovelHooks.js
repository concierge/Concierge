var BaseShovelHooks = require("../_base/ShovelHooks");
var Promise = require("node-promise/promise").Promise;
var Duplex = require("../../rpc/Duplex");
var DuplexStream = require("../../DuplexStream");
var NamespaceWrapper = require("../../rpc/NamespaceWrapper");
var util = require("util");

var ShovelHooks = module.exports = function(startData){
    BaseShovelHooks.apply(this, arguments);

    //make a new rpc server/client and expose it globally
    var rpc = this.rpc = new Duplex(new DuplexStream(process.stdin, process.stdout), {
        call_timeout: startData.call_timeout
    });

    //wrap the RPC class so it works off of it's own namespace
    this._exposedObject.rpc = new NamespaceWrapper(rpc, "sandbox");
    //expose the stream for the parent process to the global scope
    this._exposedObject.parentStream = new DuplexStream(process.stdin, process.stdout);
    //expose promise to the global scope, because it's needed for exposed methods, so why not.
    this._exposedObject.Promise = Promise;
}

util.inherits(ShovelHooks, BaseShovelHooks);

ShovelHooks.prototype.onAfterLoad = function(){
    //now just notify the parent process that everything is cool.
    this.rpc.notify("rpc.ready");
}
