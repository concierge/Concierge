rpc.expose("someCommand", function(data){
    console.log(data);
    return data;
});
process.stderr.write("This is an error!");
