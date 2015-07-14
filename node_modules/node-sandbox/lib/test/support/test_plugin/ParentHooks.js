var ParentHooks = module.exports = function(options, parentObject, pluginManager){
    //parentObject is a pointer to the parent Sandbox instance,
    //options are the options that were passed to it
    this._sandbox = parentObject;
    this._manager = pluginManager;
    this._options = options;
    //startData is passed to the shovel when we start
    //and is accessible from ShovelHooks (just make sure
    //you can serialize it as JSON)
    //Note that this MUST be created in the constructor
    this.startData = {};
}

ParentHooks.prototype.onFoo = function(arg){
    this._testArg = arg;
}
