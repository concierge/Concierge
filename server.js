/*
	HERE BE DRAGONS!
	Written to see if it could be done,
	not written to be readable. Enter at your
	own peril.
	
	Copyright Matthew Knox (c) 2015.
	Licensed under the MIT license.
*/

var giphy = require('giphy-wrapper')('dc6zaTOxFJmzC');
var quarantine = require("quarantine")(500);
var login = require("facebook-chat-api");
var api = null;

var logCodeBeginning = "(function(){\
	var console = {result:'',log:function(str){this.result += str + '\\r\\n';}};\
	var usrCode = function(){\
		",
	logCodeEnding =	"};\
	console.log('Returned: ' + usrCode());\
	return console.result;\
})()";

var runBot = function(api, thread, code) {
	code = logCodeBeginning + code + logCodeEnding;
	quarantine({}, code, function(){
		if (arguments[0] != null && arguments[0] != 'null') {
			api.sendMessage('Error:\n' + arguments[0], thread);
		}
		else {
			api.sendMessage(arguments[1], thread);
		}
	});
	
	/*var spl = arguments[1].match(/[^\r\n]+/g); 
	for (var i = 0; spl.length; i++) {
		listenCallback(null, {type:"message",body:arguments[1]}, null);
	}*/
};

var toTitleCase = function(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var karmaArray = {};
var runKarma = function(api, event, text) {
	var karma = 0, name = "";
	for (var i = text.length - 2; i != -1; i--) {
		if (text[i] == '+') {
			karma++;
		}
		else if (text[i] == '-') {
			karma--;
		}
		else {
			name = text.substr(0, i+1);
			break;
		}
	}
	
	if (karma > 5 || karma < -5) {
		name = toTitleCase(event.sender_name.trim());
		var curr = karmaArray[name];
		if (isNaN(curr) || curr == null || curr == '') {
			curr = 0;
		}
		curr--;
		karmaArray[name] = curr;
		api.sendMessage(name + ' has modified karma too much. Therefore their karma is now ' + curr + '.', event.thread_id);
	}
	else {
		name = toTitleCase(name.trim());
		var curr = karmaArray[name];
		if (isNaN(curr) || curr == null || curr == '') {
			curr = 0;
		}
		curr += karma;
		karmaArray[name] = curr;
		api.sendMessage(name + '\'s karma is now ' + curr + '.', event.thread_id);
	}
};

var runAnim = function(api, event, text) {
	text = encodeURIComponent(text);
	giphy.search(text, 50, 0, function (err, data) {
		if (err) {
			console.error(err);
			api.sendMessage('Anim had an error :(', event.thread_id);
			return;
		}
		
		var image = data.data[Math.floor(Math.random() * data.data.length)];
		if (!image) {
			image = data.data[Math.floor(Math.random() * data.data.length)];
			if (!image) {
				image = data.data[0];
				if (!image) {
					api.sendMessage('http://thebest404pageever.com/', event.thread_id);
					return;
				}
			}
		}
		api.sendMessage(image.url, event.thread_id);
	});
};

var listenCallback = function(err, event, stopListening) {
	if(err) return console.error(err);
	switch(event.type) {
	  case "message":
		if (event.body.indexOf('/runbot') === 0) {
			runBot(api, event.thread_id, event.body.substr(7));
		}
		else if (event.body.indexOf('++', event.body.length - 2) !== -1) {
			runKarma(api, event, event.body);
		}
		else if (event.body.indexOf('--', event.body.length - 2) !== -1) {
			runKarma(api, event, event.body);
		}
		else if (event.body == '/karma') {
			api.sendMessage(JSON.stringify(karmaArray), event.thread_id);
		}
		else if (event.body.indexOf('/anim') === 0) {
			runAnim(api, event, event.body.substr(6));
		}
		else if (event.body == '/shutdown') {
			api.sendMessage('Good Night', event.thread_id);
			stopListening();
		}
		break;
	}
};

login({email: "spamme@facebook.com", password: "areallysecurepasswordhere"}, function callback (err, apil) {	
    if(err) return console.error(err);
	api = apil;
    apil.setOptions({listenEvents: true});
    apil.listen(listenCallback);
});
