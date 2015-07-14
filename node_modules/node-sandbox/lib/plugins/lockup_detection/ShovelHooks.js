var BaseShovelHooks = require("../_base/ShovelHooks");
var Promise = require("node-promise/promise").Promise

var ShovelHooks = module.exports = function(){
    BaseShovelHooks.apply(this, arguments);

    //get the RPC class from the RPC plugin
    var rpc = this.rpc = this._manager.plugins.rpc.rpc;

    //expose a 'rpc.ping' method so the host knows we're still alive
    rpc.expose("rpc.ping", function(){
        return "pong";
    });
}

util.inherits(ShovelHooks, BaseShovelHooks);
