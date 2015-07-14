var StreamParser = require("./StreamParser"),
    util = require("util"),
    uuid = require("node-uuid/uuid"),
    Promise = require("node-promise/promise").Promise;

var Client = module.exports = function(/*Stream*/stream, /*Object*/options){
    //note: options are handled by StreamParser
    StreamParser.apply(this, arguments);
    this._responsePromises = {};
}

util.inherits(Client, StreamParser);

//TODO: add functions to load SMDs for creating (simulated) callable functions

//note: options are handled by StreamParser
Client.prototype._default_options = {
    call_timeout: -1
}

Client.prototype._onPacket = function(/*Object*/data){
    this._handleResponse(data);
}

Client.prototype._call = function(/*String*/methodName, /*Object*/params, /*Object*/id){
    var p;
    //if no id was given, we're not going to get a response
    //because it's treated as a notification
    if(id){
        p = new Promise();
        this._responsePromises[id] = p;
    }
    var out = JSON.stringify({
        id: id || null,
        method: methodName,
        params: params
    });
    
    //write the command out to the stream
    this._stream.write(out+this.COMMAND_SEPARATOR);

    //if no id was given, we're not going to get a response
    //because it's treated as a notification
    if(id){
        if(this._options.call_timeout > 0){
            p.timeout(this._options.call_timeout);
        }
        return p;
    }
}

Client.prototype.call = function(/*String*/methodName, /*Object*/params){
    return this._call(methodName, params, uuid.v4());
}

Client.prototype.notify = function(/*String*/methodName, /*Object*/params){
    return this._call(methodName, params, null);
}

Client.prototype._handleResponse = function(/*Object*/data){
    var p = this._responsePromises[data.id];
    if(!data.id){
        //handle as notification
        //TODO: use an event emitter or something?
    }else if(!p){
        throw new Error("Got a response that we don't have a handler for!");
    }else{
        p[data.error ? "emitError" : "emitSuccess"](data.error || data.result);
        delete this._responsePromises[data.id];
    }
}
