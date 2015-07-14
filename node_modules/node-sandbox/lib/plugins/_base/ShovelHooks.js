var ShovelHooks = module.exports = function(options, parentObject, pluginManager){
    //`options` is the startData that we defined in the constructor of our `ParentHooks` class.
    //`parentObject` is an object that's accessible to the global scope of the child process,
    //and we can use it to expose external functions to be used in the child process.
    //`pluginManager` is a pointer to the plugin manager, and we can access 
    //other plugins through it. Eg, if we want to access the `ShovelHooks` instance of the
    //`rpc` plugin (or a plugin that provided the `rpc` functionality) we could do so via
    //`pluginManager.plugins.rpc`
    this._startData = options;
    this._exposedObject = parentObject;
    this._manager = pluginManager;
}

ShovelHooks.prototype.onAfterLoad = function(){
    //called after the shovel loads the code, and before the
    //code is executed
}

ShovelHooks.prototype.onExecute = function(){
    //called just after the process runs any untrusted code
}

ShovelHooks.prototype.onLoadError = function(){
    //called if there was a problem loading the code
}

/*
ShovelHooks.prototype.onError = function(){
    //called when an error is thrown in the child process
}

ShovelHooks.prototype.onExit = function(){
    //called just before the child process exits. If the child
    //process was killed with kill -9, this won't get called
}
*/
