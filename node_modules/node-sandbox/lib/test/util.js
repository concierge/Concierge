var net = require("net");

var util = module.exports = {
    socketPair: function(onFinish){
        var socketOne, socketTwo;
        var socketPath = "./test/support/sockets/test-socket-"+(new Date()).getTime()+"-"+Math.random().toString().substring(2, 5)+".sock";

        var server = net.createServer(function(c){
            socketOne = c;
            socketOne.die = socketTwo.die = function(){
                if(server._dead) return;
                server._dead = true;
                server.close();
                socketOne.destroy();
                socketTwo.destroy();
            }
            onFinish(socketOne, socketTwo);
        });

        server.listen(socketPath, function(){
            socketTwo = net.connect(socketPath, function(){
            });
        });
    }
};
