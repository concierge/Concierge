var assert = require("assert")
//  , fs = require("fs")
  , util = require("./util");

suite("test/util (part of test suite)", function(){
    var sock;
    var sock_listener;

    setup(function(done){
        util.socketPair(function(one, two){
            sock = one;
            sock_listener = two;
            done();
        });
    });

    teardown(function(){
        sock.die();
        sock_listener.die();
    });

    test("stream is piping from the first to the second correctly", function(done){
        sock.setEncoding("utf8");
        sock_listener.setEncoding("utf8");
        sock_listener.on("data", function(data){
            assert.equal(data, "test");
            done();
        });
        sock.write("test");
    });
    test("stream is piping from the second to the first correctly", function(done){
        sock.setEncoding("utf8");
        sock_listener.setEncoding("utf8");
        sock.on("data", function(data){
            assert.equal(data, "test");
            done();
        });
        sock_listener.write("test");
    });
});
