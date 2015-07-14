var BaseShovelHooks = require("../_base/ShovelHooks");
var util = require("util");
var wrapperFactory = require("../../wrapperFactory");

//Just a special note: this plugin in no way is guaranteeing a bulletproof containment method.
//It relies heavily on the current Node API and is really a superficial way of making a secure container.
//Something truly secure would rely on OS-level security tools.

var ShovelHooks = module.exports = function(options, parentObject, pluginManager){
    BaseShovelHooks.apply(this, arguments);
}

util.inherits(ShovelHooks, BaseShovelHooks);

ShovelHooks.prototype.onAfterLoad = function(){
    //seal off process.binding() and require() before running any code
    global.process.binding = wrapperFactory.processBinding(global.process.binding, this._startData.permissions);
    //global.require = wrapperFactory.require(global.require, this._startData.permissions);
    
    //delete some dangerous functions
    delete process.kill;
    delete process._kill;
    delete process.dlopen;
    delete process.setuid;
    delete process.setgid;
}
