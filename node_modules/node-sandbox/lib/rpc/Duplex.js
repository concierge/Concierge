var StreamParser = require("./StreamParser");
    Server = require("./Server"),
    Client = require("./Client"),
    util = require("util");
var _ = require("underscore/underscore");

var Duplex = module.exports = function(/*Stream*/stream, /*Object*/options){
    StreamParser.apply(this, arguments);

    //recreate local variables for each class
    //maybe there's a more elegant way of doing this?
    this._responsePromises = {};
    this._exposedObject = {};
}

//NOTE: this is a somewhat ugly trick to get multiple inheritence working.
var duplex_old = _.clone(Duplex);
var duplex_proto_old = _.clone(Duplex.prototype);
_.extend(Duplex.prototype, Server.prototype);
_.extend(Duplex.prototype, Client.prototype);
_.extend(Duplex, Server);
_.extend(Duplex, Client);
_.extend(Duplex, duplex_old);
_.extend(Duplex.prototype, duplex_proto_old);

//This doesn't work, because util.inherits overrides whatever is already in Duplex.prototype,
//so we only get stuff inherited from Client
//util.inherits(Duplex, Server);
//util.inherits(Duplex, Client);

Duplex.prototype._onPacket = function(/*Object*/data){
    //console.log((data.result ? "SERVER <---- " : "CLIENT <---- "), data);
    if(data.result || data.error) //response
        this._handleResponse(data);
    else if(data.method) //request
        this._handleRequest(data);
}
