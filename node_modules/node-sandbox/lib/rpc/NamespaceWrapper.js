var _ = require("underscore/underscore");

//takes either a `Server`, `Client`, or `Duplex` instance
//and a namespace. It forwards any method calls to the
//given instance, and wraps any functions involving calling
//or exposing methods so that it stays within the given namespace
var NamespaceWrapper = module.exports = function(/*Server|Client|Duplex*/instance, /*String*/namespace){

    this._isWrapper = true;

    //`methodsToChange` contains the methods we're intercepting.
    var methodsToChange = {
        call: function(method, args){
            return instance.call(namespace+"."+method, args);
        },
        notify: function(method, args){
            return instance.notify(namespace+"."+method, args);
        },
        expose: function(name, value){
            return instance.expose(namespace+"."+name, value);
        },
        exposeObject: function(obj){
            return instance.expose(namespace, obj);
        },
        unexpose: function(name){
            if(name)
                return instance.unexpose(namespace+"."+name);
            else
                return instance.unexpose(namespace);
        }
    }

    var self = this;

    //cycle through each property in `instace` and
    //create getters/setters
    for(var i in instance){
        //create a new scope so any functions we define are run inside this scope
        //(otherwise when we try to access `i` after the for loop is over, it'd be
        //set to the last value in the loop)
        (function(i){
            
            //if we need to wrap this function, override it, otherwise
            //just create a getter/setter locally
            if(methodsToChange[i]){
                self[i] = methodsToChange[i];
            }else{

                //This might work with methods but I have no idea (scope issues)
                //if not, just make a special case for functions.
                self.__defineGetter__(i, function(){
                    return instance[i];
                });
                self.__defineSetter__(i, function(arg){
                    instance[i] = arg;
                });
            }

        })(i);
    }
}
