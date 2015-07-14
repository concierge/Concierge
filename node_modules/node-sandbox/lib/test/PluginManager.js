var PluginManager = require("../PluginManager");
var assert = require("assert");

suite("PluginManager - Loads plugins that provide additional functionality to sandbox", function(){
    
    var testModule = function(plugin, args){
        var parent_obj = {};
        var p = new PluginManager([{name: plugin, options: args}], "ParentHooks", null, parent_obj);
        
        var basePlugin = require((plugin.indexOf("/") < 0 ? "../plugins/" : "../")+plugin+"/ParentHooks");
        var test_parent_obj = {};
        var testInstance = new basePlugin(args, test_parent_obj, p);

        //workaround to prevent circular structure checking
        delete testInstance._manager;
        for(var i in p.plugins)
            delete p.plugins[i]._manager;
            assert.deepEqual(p.plugins[i], testInstance);
        assert.deepEqual(parent_obj, test_parent_obj);
        return [p, testInstance];
    }

    test("Loads local plugins", function(){
        testModule("_base", {});
    });
    test("Loads external plugins + passes arguments", function(){
        var testOptions = {foo: "bar"};
        var objs = testModule("./test/support/test_plugin", testOptions);
        for(var i in objs[0].plugins)
            assert.deepEqual(objs[0].plugins[i]._options, testOptions);
    });
    test("Calls hooks successfully", function(){
        var testObj = {bar: "baz"};
        var objs = testModule("./test/support/test_plugin", {});
        objs[0].call("foo", testObj);
        for(var i in objs[0].plugins)
            assert.deepEqual(objs[0].plugins[i]._testArg, testObj);
    });
    test("Plugin dependencies/conflicts/provides are respected");
});
