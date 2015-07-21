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
	if (!this.config[thread]) {
		this.config[thread] = {};
	}

	if (karmaChange.name.trim() === '') {
		var responses = ['I eat blank karma for breakfast.', 'A karma with every meal is good apparently.',
		'Thank-you for appriciating my efforts.', 'Karma comes only to those you give it too.', 'You are tosser.'];
        var index = Math.floor(Math.random() * responses.length);
		return responses[index] + ' Try again.';
	}

	person = person.toProperCase();
	if (!this.config[thread][person]) {
		this.config[thread][person] = 0;
	}
	if (exports.checkPerson(karmaChange.name, person)) {
		if (karmaChange.karma > 0) {
			karmaChange.karma *= -1;
		}
		this.config[thread][person] += karmaChange.karma;
		return person + ' modified their own karma. As punishment they now have ' + this.config[thread][person] + ' karma.';
	}

	if (karmaChange.karma >= 5 || karmaChange.karma <= -5) {
		if (karmaChange.karma > 0) {
			karmaChange.karma *= -1;
		}
		this.config[thread][person] += karmaChange.karma;
		return person + ' modified karma too much. As punishment they now have ' + this.config[thread][person] + ' karma.';
	}

	if (!this.config[thread][karmaChange.name]) {
		this.config[thread][karmaChange.name] = 0;
	}
	this.config[thread][karmaChange.name] += karmaChange.karma;
	return karmaChange.name + ' now has ' + this.config[thread][karmaChange.name] + ' karma.';
};

exports.printKarma = function(api, event) {
	var karmas = this.config[event.thread_id];
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
};
