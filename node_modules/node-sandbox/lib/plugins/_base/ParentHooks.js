var ParentHooks = module.exports = function(options, parentObject, pluginManager){
    //`parentObject` is a pointer to the parent Sandbox instance,
    //`options` are the options that were passed to it
    //`pluginManager` is a pointer to the plugin manager, and we can access 
    //other plugins through it. Eg, if we want to access the `ParentHooks` instance of the
    //`rpc` plugin (or a plugin that provided the `rpc` functionality) we could do so via
    //`pluginManager.plugins.rpc`
    this._sandbox = parentObject;
    this._manager = pluginManager;
    this._options = options;
    //startData is passed to the shovel when we start
    //and is accessible from ShovelHooks (just make sure
    //you can serialize it as JSON)
    //Note that this can ONLY be defined/modified in the constructor
    this.startData = {};
}

ParentHooks.prototype.onSpawn = function(cprocess){
    //called right after the child process is started
}

ParentHooks.prototype.onKill = function(){
    //called just before the kill signal is sent to the process
}

ParentHooks.prototype.onError = function(data){
    //called when the child process prints out to stderr
}

ParentHooks.prototype.onExit = function(code, signal){
    //called when the child process exits. This can be either after
    //it's killed, or when it finishes executing.
}
