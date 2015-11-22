var require_install = require('require-install'),
  quarantine = require_install("quarantine")(500),
	logCodeBeginning = "(function(){\
	var console = {result:'',log:function(str){this.result += str + '\\r\\n';}};\
	var usrCode = function(){\
		",
	logCodeEnding =	"};\
	console.log('Returned: ' + usrCode());\
	return console.result;\
})()";

exports.match = function(text) {
	return text.startsWith(this.commandPrefix + 'runbot');
};

exports.help = function() {
	return this.commandPrefix + 'runbot <jscode> : Runs JS code.';
};

exports.wrapCode = function(message) {
	var code = message.substr(this.commandPrefix.length + 6);
	return logCodeBeginning + code + logCodeEnding;
};

exports.run = function(api, event) {
	var code = exports.wrapCode(event.body);
	quarantine({}, code, function(){
		if (arguments[0] && arguments[0] != null && arguments[0] != 'null') {
			api.sendMessage('Error:\n' + arguments[0], event.thread_id);
		}
		else {
			api.sendMessage(arguments[1], event.thread_id);
		}
	});
};
