var wrapperFactory = require("../wrapperFactory");
var assert = require("assert");

suite("wrapperFactory - creates wrapped/restricted functions", function(){
    test("wrapper allows loading of whitelisted modules", function(done){
        var func = function(mod){
            assert.equal(mod, "myModule");
            done();
        }
        var wrappedFunc = wrapperFactory.processBinding(func, ["myModule"]);
        wrappedFunc("myModule");
    });
    test("wrapper disallows loading of non-whitelisted modules", function(done){
        var func = function(mod){
            assert.equal(mod, "myModule");
            done();
        }
        var wrappedFunc = wrapperFactory.processBinding(func, ["myModule"]);
        try{
            wrappedFunc("someModule");
            assert.fail("wrappedFunc didn't prevent us importing a non-whitelisted module!");
        }catch(e){
            assert.equal(e.message, "Tried to load a non-white listed module `someModule`!");
            wrappedFunc("myModule");
        }
    });
});
