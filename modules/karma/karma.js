exports.match = function(event, commandPrefix) {
	return event.body.endsWith('++') || event.body.endsWith('--') || event.body === commandPrefix + 'karma';
};

exports.parseKarmaChange = function(message) {
	var karma = 0, name = "";
	for (var i = message.length - 2; i !== -1; i--) {
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
		'Thank-you for appreciating my efforts.', 'Karma comes only to those you give it too.', 'You are tosser.'];
        var index = Math.floor(Math.random() * responses.length);
		return responses[index] + ' Try again.';
	}

	person = person.toProperCase();
	if (!this.config[thread][person]) {
		this.config[thread][person] = {karma:0,lastAlteredBy:'',lastAlteredCount:0,lastAlteredTime:null,quotta:0,timeSinceQuottaStart:new Date()};
	}
	if (this.config[thread][person].timeSinceQuottaStart == null) {
		this.config[thread][person].timeSinceQuottaStart = new Date();
	}

	if (new Date() - this.config[thread][person].timeSinceQuottaStart > this.config.karmaTimeLimit && this.config[thread][person].karmaTimeLimit != null) {
		this.config[thread][person].timeSinceQuottaStart = new Date();
		this.config[thread][person].quotta = 0;
	}

	if(this.config[thread][person].quotta >= this.config.karmaPerDay) {
		//todo say how long until they can karma again
		return person + ' has used there karma quota for today, please try again tomorrow';
	}

	if (exports.checkPerson(karmaChange.name, person)) {
		if (karmaChange.karma > 0) {
			karmaChange.karma *= -1;
		}
		this.config[thread][person].karma += karmaChange.karma;
		this.config[thread][person].quotta += Math.abs(karmaChange.karma);
		return person + ' modified their own karma. As punishment they now have ' + this.config[thread][person].karma + ' karma.';
	}

	if (karmaChange.karma >= this.config.bound || karmaChange.karma <= -this.config.bound) {
		if (karmaChange.karma > 0) {
			karmaChange.karma *= -1;
		}
		this.config[thread][person].karma += karmaChange.karma;
		this.config[thread][person].quotta += Math.abs(karmaChange.karma);
		return person + ' modified karma too much. As punishment they now have ' + this.config[thread][person].karma + ' karma.';
	}

	if (!this.config[thread][karmaChange.name]) {
		this.config[thread][karmaChange.name] = {karma:0,lastAlteredBy:'',lastAlteredCount:0,lastAlteredTime:null,quotta:0,timeSinceQuottaStart:null};
	}

	if (new Date() - this.config[thread][karmaChange.name].lastAlteredTime > this.config.alteredTime) {
		this.config[thread][karmaChange.name].lastAlteredCount = 0;
	}

	if (person === this.config[thread][karmaChange.name].lastAlteredBy && this.config[thread][karmaChange.name].lastAlteredCount === this.config.alteredCount) {
		if (karmaChange.karma > 0) {
			karmaChange.karma *= -1;
		}
		this.config[thread][person].karma += karmaChange.karma;
		this.config[thread][person].quotta += Math.abs(karmaChange.karma);
		return person + ' modified the karma of ' + karmaChange.name + ' too often. As punishment they now have ' + this.config[thread][person].karma + ' karma.';
	}
	else {
		this.config[thread][karmaChange.name].lastAlteredBy = person;
		this.config[thread][karmaChange.name].lastAlteredCount =
			person === this.config[thread][karmaChange.name].lastAlteredBy ? this.config[thread][karmaChange.name].lastAlteredCount + 1: 1;
		this.config[thread][karmaChange.name].lastAlteredTime = new Date();
	}

	if (this.config[thread][person].quotta + Math.abs(karmaChange.karma) >= this.config.karmaPerDay) {
		var karma = this.config.karmaPerDay - this.config[thread][person].quotta;
		this.config[thread][person].quotta += karma;
		if (karmaChange.karma < 0) {
			karma *= -1;
		}
		this.config[thread][karmaChange.name].karma += karma;
		return karmaChange.name + ' now has ' + this.config[thread][karmaChange.name].karma + ' karma\n' +
				person + ' has reached their karma limit for today.';
	}


	this.config[thread][person].quotta += Math.abs(karmaChange.karma);
	this.config[thread][karmaChange.name].karma += karmaChange.karma;
	return karmaChange.name + ' now has ' + this.config[thread][karmaChange.name].karma + ' karma.';
};

exports.printKarma = function(api, event) {
	var karmas = this.config[event.thread_id];
	var message = '';
	for (var k in karmas) {
		message += k + ' \t→ ' + karmas[k].karma + '\n';
	}
	api.sendMessage((message === '' ? 'Somebody has failed to meet their meanness quota for the day. No karmas to show.' : message), event.thread_id);
};

exports.run = function(api, event) {
	if (event.body === api.commandPrefix + 'karma') {
		exports.printKarma(api, event);
		return;
	}

	var karmaChange = exports.parseKarmaChange(event.body);
	var result = exports.modifyKarma(karmaChange, event.sender_name.trim(), event.thread_id);
	api.sendMessage(result, event.thread_id);
};

exports.load = function() {
	if (!this.config.bound) {
		this.config.bound = 5;
	}
	if (!this.config.alteredCount) {
		this.config.alteredCount = 3;
	}
	if (!this.config.alteredTime) {
		this.config.alteredTime = 120000; // 2 mins
	}
	if (!this.config.karmaTimeLimit) {
		this.config.karmaTimeLimit = 86400000; // 24hrs
	}
	if (!this.config.karmaPerDay) {
		this.config.karmaPerDay = 10;
	}
};
