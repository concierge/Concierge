var fs = require('fs'),
	karmaMap = {}; // Yes, I know. JS doesn't have a real map object...

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}

exports.match = function(text) {
	return text.endsWith('++') || text.endsWith('--') || text === '/karma';
};

exports.help = function() {
	return '<text>++.. : Increases <text>\' karma.\n\
<text>--.. : Decreases <text>\'s karma.\n\
/karma : Shows all current karma.';
};

exports.parseKarmaChange = function(message) {
	var karma = 0, name = "";
	for (var i = message.length - 2; i != -1; i--) {
		switch(message[i]){
			case '+': karma++; break;
			case '-': karma--; break;
			default: name = message.substr(0, i+1); i = 0; break;
		}
	}
	return {name: name.trim().toProperCase(), karma: karma};
};

exports.checkPerson = function(karma, person) {
	var ps = person.split(' '),
		ks = karma.split(' '),
		overlap = ps.filter(function(n) {
		return ks.indexOf(n) != -1
	});
	return overlap.length != 0;
};

exports.modifyKarma = function(karmaChange, person, thread) {
	if (!karmaMap[thread]) {
		karmaMap[thread] = {};
	}
	
	if (karmaChange.name.trim() === '') {
		var responses = ['I eat blank karma for breakfast.', 'A karma with every meal is good apparently.',
		'Thank-you for appriciating my efforts.', 'Karma comes only to those you give it too.', 'You are tosser.'];
        var index = Math.floor(Math.random() * responses.length);
		return responses[index] + ' Try again.';
	}
	
	person = person.toProperCase();
	if (!karmaMap[thread][person]) {
		karmaMap[thread][person] = 0;
	}
	if (exports.checkPerson(karmaChange.name, person)) {
		if (karmaChange.karma > 0) {
			karmaChange.karma *= -1;
		}
		karmaMap[thread][person] += karmaChange.karma;
		return person + ' modified their own karma. As punishment they now have ' + karmaMap[thread][person] + ' karma.';
	}
	
	if (karmaChange.karma >= 5 || karmaChange.karma <= -5) {
		if (karmaChange.karma > 0) {
			karmaChange.karma *= -1;
		}
		karmaMap[thread][person] += karmaChange.karma;
		return person + ' modified karma too much. As punishment they now have ' + karmaMap[thread][person] + ' karma.';
	}
	
	if (!karmaMap[thread][karmaChange.name]) {
		karmaMap[thread][karmaChange.name] = 0;
	}
	karmaMap[thread][karmaChange.name] += karmaChange.karma;
	return karmaChange.name + ' now has ' + karmaMap[thread][karmaChange.name] + ' karma.';
};

exports.printKarma = function(api, event) {
	var karmas = karmaMap[event.thread_id];
	var message = '';
	for (var k in karmas) {
		message += k + ': ' + karmas[k] + '\n';
	}
	api.sendMessage(message, event.thread_id);
};

exports.run = function(api, event) {
	if (event.body === '/karma') {
		exports.printKarma(api, event);
		return;
	}
	
	var karmaChange = exports.parseKarmaChange(event.body);
	var result = exports.modifyKarma(karmaChange, event.sender_name.trim(), event.thread_id);
	api.sendMessage(result, event.thread_id);
	fs.writeFile('karmaBackup.json', JSON.stringify(karmaMap), 'utf8');
};

exports.load = function() {
	fs.readFile('karmaBackup.json', 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}
		var karma = JSON.parse(data);
		karmaMap = karma;
	});
};