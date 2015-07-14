var StreamParser = require("./StreamParser"),
    util = require("util"),
    Promise = require("node-promise/promise").Promise;

var Server = module.exports = function(/*Stream*/stream, /*Object*/options){
    //note: options are handled by StreamParser
    StreamParser.apply(this, arguments);
    this._exposedObject = {};
}

util.inherits(Server, StreamParser);

//TODO: implement hooks for generating SMDs

Server.prototype.exposeObject = function(/*Object*/obj){
    this._exposedObject = obj;
}

Server.prototype.expose = function(/*String*/name, /*Object|Function*/value){
    //if a '.' is in the key, we look for the object.
    //if it doesn't exist, we make it
    var parentObj = name.substring(0, name.lastIndexOf("."));
    var obj = this._getProperty(this._exposedObject, parentObj);
    if(!obj){
        //make the object
        var keys = parentObj.split(".");
        var cursor = this._exposedObject;
        while(keys.length > 0){
            if(cursor[keys[0]]){
                cursor = cursor[keys[0]];
            }else{
                cursor = cursor[keys[0]] = {};
            }
            keys.shift(1);
        }
        obj = cursor;
    }

    obj[name.substring(name.lastIndexOf(".")+1)] = value;
}

Server.prototype.unexpose = function(/*String*/name){
    var parentObj = name.substring(0, name.lastIndexOf("."));
    var methodName = name.substring(name.lastIndexOf(".")+1);
    var obj = this._getProperty(this._exposedObject, parentObj);
    delete obj[methodName];
}

Server.prototype._onPacket = function(/*Object*/data){
    this._handleRequest(data);
}

Server.prototype._getProperty = function(/*Object*/object, /*String*/key){
    var keys = key.split(".");
    var cursor = object;
    while(keys.length > 0){
        if(keys[0] == ""){
            keys.shift(1);
            continue;
        }
        cursor = cursor[keys[0]];
        if(cursor == undefined)
            return undefined;
        keys.shift(1);
    }
    return cursor;
}

Server.prototype._handleRequest = function(/*Object*/data){
    var method;
    //if either data.method or the method we're looking up is undefined, return an error to the client
    if(
      !data.method ||
      !(method = this._getProperty(this._exposedObject, data.method))
    ){
        return this._handleError(new Error("Couldn't find the method requested ("+data.method+")"), data.id, Server.METHOD_NOT_FOUND);
    }

    //get the parent obj so we can call it in context
    var parentObj = this._getProperty(this._exposedObject, data.method.substring(0, data.method.lastIndexOf(".")));

    var result;

    //call the function requested.
    //if there's an error while calling the function, return an error to client
    try{
        if(Array.isArray(data.params)){
            result = method.apply(parentObj, data.params);
        }else{
            result = method.apply(parentObj, [data.params]);
        }
    }catch(e){
        return this._handleError(e, data.id, Server.INTERNAL_ERROR);
    }

    //if there's no id, we don't give a response
    //and treat it like a notification
    if(data.id){
        if(typeof result == "object"
        && typeof result.then == "function"){
            //handle as promise
            var self = this;
            result.then(function(out){
                self._handleSuccess(out, data.id);
            }, function(err){
                self._handleError(err, data.id);
            });
        }else{
            //pass result to client
            this._handleSuccess(result, data.id);
        }
    }
}

Server.prototype._handleSuccess = function(/*Object*/result, /*String*/id){
    var out = JSON.stringify({
        id: id,
        result: result,
        error: null
    });
    //console.log("SERVER ----> "+out);
    this._stream.write(out+this.COMMAND_SEPARATOR);
}

//error related stuff

Server.INVALID_REQUEST = -32600;
Server.METHOD_NOT_FOUND = -32601;
Server.PARSE_ERROR = -32700;
Server.INTERNAL_ERROR = -32603;

Server.prototype._handleError = function(/*Error*/error, /*String?*/id, /*int?*/code){
    var out = JSON.stringify({
        id: typeof id != "undefined" ? id : null,
        result: null,
        error: {
            code: code || Server.INTERNAL_ERROR,
            message: error.message,
            data: {
                stack: error.stack,
                arguments: error.arguments,
                type: error.type
            }
        }
    });
    //console.log("SERVER ----> "+out);
    this._stream.write(out+this.COMMAND_SEPARATOR);
}

Server.prototype._handleParseError = function(/*Error*/e){
    this._handleError(e, null, Server.PARSE_ERROR);
}
