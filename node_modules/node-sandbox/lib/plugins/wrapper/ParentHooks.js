var BaseParentHooks = require("../_base/ParentHooks");
var util = require("util");

var ParentHooks = module.exports = function(options, parentObject, pluginManager){
    BaseParentHooks.apply(this, arguments);
    this.startData = {
        permissions: this._sandbox._options.permissions
    };
}

util.inherits(ParentHooks, BaseParentHooks);
