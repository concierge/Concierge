var wrapperFactory = module.exports = {

//I'm skipping writing these functions for now, cause if we try to 
//load a banned module, we'll get a stack trace from the thrown error
//so users will prolly be able to figure out what happened on their own
/*
    require: function(originalRequire, allowedModules){
        //Builds a limited require() function that can only import modules based on
        //given rules/permissions
        
        //TODO:
        return originalRequire;
    },
    _transformPermissionsToModules: function(permissions){
        //transforms a set of permissions (anything that gets passed to `process.binding`)
        //into a set of core modules that are allowed to be imported
    },
*/
    processBinding: function(/*Function*/originalProcessBinding, /*Array*/allowedModules){
        return function(module){
            if(allowedModules.indexOf(module) == -1){
                //console.error("Tried to load a non-white listed module `"+module+"`!");
                throw new Error("Tried to load a non-white listed module `"+module+"`!");
            }
            return originalProcessBinding(module);
        };
    }
};
