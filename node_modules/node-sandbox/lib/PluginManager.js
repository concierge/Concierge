var MANIFEST_FILE = "manifest";

var PluginManager = module.exports = function(plugins, pluginClassName, pluginDir, parentObject){
    //note that `plugins` is an array of objects w/ the following format:
    //{name: String, options: Object}
    //options gets passed to the plugin instance
    //note that if a path instead of a name is specified for `name`,
    //the plugin manager will load the path instead of looking in the plugins dir
    //note that paths should either be absolute, or relative to the dir this file is in.

    var plugin_instances = this.plugins = {};
    var plugin_metadata = this._metadata = {};
    this._parentObject = parentObject;

    if(!pluginDir) pluginDir = "./plugins";
    
    var self = this;

    var conflictTests = [];

    plugins = this._normalizePluginArg(plugins);
    
    //manifest initialization and dependency checks
    plugins.forEach(function(plugin){

        //load manifest
        var manifest = require(self._getDirectory(pluginDir, plugin.name) + MANIFEST_FILE);

        //add the plugin and anything it provides to the this._metadata member variable
        //if we're providing something that already exists, throw an error
        plugin_metadata[manifest.name] = manifest;
        manifest.provides.forEach(function(provide){
            if(plugin_metadata[provide])
                throw new Error("Plugin '"+plugin.name+"' provides '"+provide+"', but that's already provided by '"+plugin_metadata[provide].name+"'!");
            plugin_metadata[provide] = manifest;
        });

        //test dependencies/conflicts, throw error if there's an issue
        self._testPackages(manifest.name, manifest.depends, true);
        conflictTests.push([manifest.name, manifest.conflicts, false]);

    });

    //Test for conflicts. We can't test while loading plugins since
    //a conflicting plugin might not have been loaded yet, but a
    //dependant plugin needs to be loaded before the depending plugin
    conflictTests.forEach(function(args){
        self._testPackages.apply(self, args);
    });
    
    //load the plugin classes now that we tested everything
    plugins.forEach(function(plugin){
        //load manifest again
        var manifest = require(self._getDirectory(pluginDir, plugin.name) + MANIFEST_FILE);

        //load the constructor
        var constructor = require(self._getDirectory(pluginDir, plugin.name) + pluginClassName);
        
        var instance = new constructor(plugin.options, parentObject, self);
        plugin_instances[manifest.name] = instance;
    });
}

PluginManager.prototype._getDirectory = function(pluginDir, name){
    if(name.indexOf("/") < 0){
        return pluginDir + "/" + name + "/";
    }else{
        return name + "/";
    }
}

PluginManager.prototype._normalizePluginArg = function(plugins){
    for(var i in plugins){
        var plugin = plugins[i];
        //if plugin is just a string, turn it into an object.
        if(typeof plugin == "string")
            plugin = plugins[i] = {name: plugin};
        //if no options were specified, make an empty object
        if(!plugin.options)
            plugin.options = {};
    }
    return plugins;
}

PluginManager.prototype._testPackages = function(name, pluginList, isDependent){
    var self = this;
    pluginList.forEach(function(pluginName){
        //if we're dependent and the package doesn't exist, or 
        //if we're conflicting and the package does exist, throw an exception
        if(!!self._metadata[pluginName] != isDependent){
            //if we're conflicting, look up the real name of the
            //conflicting package, otherwise just use the depending
            //package name (since there's no way of telling what provides what)
            var realPluginName = pluginName;
            if(!isDependent)
                realPluginName = self.plugin_metadata[packageName].name;
            throw new Error("Plugin '"+name+"' "+(isDependent ? "depends on" : "conflicts with")+" plugin '"+realPluginName+"'!");
        }
    });
}

PluginManager.prototype.call = function(method, args){
    if(!Array.isArray(args)) args = [args];
    if(!args) args = [];
    //get the method changed to `on[EventName]` format
    var realMethod = "on" + method.charAt(0).toUpperCase() + method.slice(1);
    //iterate through this.plugins and call each method
    for(var key in this.plugins){
        var plugin = this.plugins[key];
        plugin[realMethod].apply(plugin, args);
    }
}

PluginManager.prototype.get = function(varName){
    //get a variable from each plugin, return an object with
    //the value for each plugin, the key being the plugin name
    var obj = {};
    for(var i in this.plugins){
        obj[i] = this.plugins[i][varName];
    }
    return obj;
}
