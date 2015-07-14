var _ = require("underscore/underscore");

var StreamParser = module.exports = function(/*Stream*/stream, /*Object*/options){
    this._stream = stream;
    if(!options) options = {};
    this._options = _.defaults(options, this._default_options);

    var self = this;
    stream.on("data", function(/*Buffer*/data){
        self._handleData(data);
    });
}

StreamParser.prototype._default_options = {};

StreamParser.prototype.COMMAND_SEPARATOR = "\n";

StreamParser.prototype._handleData = function(/*Buffer*/data){
    var self = this;
    //this is way faster than slicing the buffer, since
    //strings are built into v8 and are made for unicode,
    //where buffers are meant for binary data.
    data.toString("utf8").split(this.COMMAND_SEPARATOR).forEach(function(item){
        //console.log((self.expose ? "SERVER <---- " : "CLIENT <---- ")+item);
        if(item == "") return;
        try{
            item = JSON.parse(item); //TODO: use a faster JSON parsing lib?
        }catch(e){
            self._handleParseError(e);
        }
        self._onPacket(item);
    });
}

StreamParser.prototype._handleParseError = function(/*Error*/e){
    //stub method
}

StreamParser.prototype._onPacket = function(/*Object*/ data){
    throw new Error("_onPacket is meant to be implemented in a subclass");
}
