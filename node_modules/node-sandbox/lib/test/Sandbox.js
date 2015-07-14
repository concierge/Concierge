var Sandbox = require("../Sandbox")
  , path = require('path')
  , assert = require("assert");

suite("Sandbox - main sandbox class", function(){
    var TEST_CODE_PATH = path.join(__dirname, "/support/sandboxed_code.js");
    var TEST_BAD_CODE_PATH = path.join(__dirname, "/support/causes_lockup.js");
    var TEST_BAD_CODE_DELAYED_PATH = path.join(__dirname, "/support/causes_lockup_delay.js");
    var sb;

    teardown(function(){
        //kill any stray child process
        if(sb._process != null)
            sb._process.kill('SIGKILL');
    });
    
    test("Sandbox starts", function(done){
        sb = new Sandbox(TEST_CODE_PATH);
        sb.run();

        //DEBUG CODE
        /*
        sb._process.stderr.setEncoding("utf8");
        sb._process.stderr.on("data", function(data){
            console.log(data);
        });
        sb._process.stdout.setEncoding("utf8");
        sb._process.stdout.on("data", function(data){
            console.log(data);
        });
        //*/
        
        sb.on("lockup", function(err){
            throw new Error("Sandbox emitted a lockup event!");
        });
        
        sb.on("error", function(err){
            throw new Error("Sandbox emitted an error event!");
        });

        sb.on("ready", function(){
            assert(sb._process);
            done();
        });
    });
    
    test("Calling methods via RPC", function(done){
        sb = new Sandbox(TEST_CODE_PATH);
        sb.run();
        
        sb.on("lockup", function(err){
            throw new Error("Sandbox emitted a lockup event!");
        });
        
        sb.on("error", function(err){
            throw new Error("Sandbox emitted an error event!");
        });

        sb.on("ready", function(){
            assert(sb._process);
            sb.rpc.call("someCommand", {foo: "bar"}).then(function(data){
                assert.deepEqual({foo: "bar"}, data);
                done();
            });
        });
    });
    
    test("Sandbox generates 'stderr' events", function(done){
        sb = new Sandbox(TEST_CODE_PATH);
        sb.run();
        
        sb.on("lockup", function(err){
            throw new Error("Sandbox emitted a lockup signal!");
        });

        sb.once("stderr", function(data){
            assert.equal("This is an error!", data.toString());
            done();
        });
    });
    
    test("Sandbox generates 'ping' events", function(done){
        sb = new Sandbox(TEST_CODE_PATH, {
            ping_interval: 10
        });
        sb.run();

        sb.once("ping", function(time){
            assert(typeof time == "number" && time >= 0);
            done();
        });
    });

    var lockup_test = function(path, failure_message, done){
        sb = new Sandbox(path, {
            ping_interval: 10,
            lockup_timeout: 20,
            kill_with_fire_timeout: 10,
            startup_timeout: 200,
        });
       
        sb.run();

        var lockup_called = false;

        sb.on("exit", function(){
            assert(lockup_called);
            done();
        });

        sb.on("lockup", function(err){
            lockup_called = true;
            assert.equal(err.message, failure_message);
            sb.kill();
        });
    }

    test("Sandbox generates 'lockup' events, and kills processes/generates 'exit' events (immediate lockup)", function(done){
        lockup_test(TEST_BAD_CODE_PATH, "Lockup detected", done);
    });

    test("Sandbox generates 'lockup' events, and kills processes/generates 'exit' events (delayed lockup)", function(done){
        lockup_test(TEST_BAD_CODE_DELAYED_PATH, "Lockup detected", done);
    });
});
