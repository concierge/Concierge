var timer;

exports.help = function() {
	return this.commandPrefix + 'vote "<question>" <optionalTimeout> "<answer1>" "<answer2>"'
	+ ' ... : Call a vote on a question.\n' +
	this.commandPrefix + 'vote cancel : cancel the current vote.\n' +
	this.commandPrefix + 'vote <number> : vote for an option.';
};

exports.match = function(text, thread, senderName, api) {
	return text.startsWith(this.commandPrefix + 'vote');
};

exports.createVote = function(api, event, spl, timeout) {
	var person = event.sender_name.trim();

	var response = person + ' called a new vote:\n\n' + spl[0] + '\n\n'
	+ 'The options are:\n';

	this.config[event.thread_id] = {
		question: spl[0],
		answers: [],
		answersText: [],
		votes: {}
	};
	for (var i = 1; i < spl.length; i++) {
		response += i + '. ' + spl[i] + '\n';
		this.config[event.thread_id].answers.push(i);
		this.config[event.thread_id].answersText.push(spl[i]);
	}

	api.sendMessage(response, event.thread_id);
	if (timeout > 0) {
		api.sendMessage(timeout + ' seconds remaining.', event.thread_id);
		timer = setTimeout(function() {
			api.sendMessage('Vote over.', event.thread_id);
			exports.print(api, event);
			clearTimeout(timer);
			delete exports.config[event.thread_id];
		}, timeout * 1000);
	}
};

exports.castVote = function(api, event, val) {
	var person = event.sender_name.trim();
	
	if (!this.config[event.thread_id]) {
		api.sendMessage('No vote in progress. Stupid ' + person + '!', event.thread_id);
		return;
	}

	if (this.config[event.thread_id].answers.indexOf(val) === -1) {
		api.sendMessage('I don\'t know what to say ' + person + ', that isn\'t even an option.', event.thread_id);
		return;
	}

	if (this.config[event.thread_id][person]) {
		api.sendMessage('No, ' + person + ', you cannot vote more than once. Maybe I should deduct some karma...', event.thread_id);
		return;
	}

	val--;
	
	this.config[event.thread_id][person] = true;
	if (!this.config[event.thread_id].votes[val]) {
		this.config[event.thread_id].votes[val] = 1;
	}
	else {
		this.config[event.thread_id].votes[val]++;
	}

	api.sendMessage('Vote cast.', event.thread_id);
};

exports.isNumeric = function(n) {
	// http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
	return !isNaN(parseFloat(n)) && isFinite(n);
}

exports.print = function(api, event) {
	if (!this.config[event.thread_id]) {
		api.sendMessage('No votes in progress?', event.thread_id);
		return;
	}
	var votes = this.config[event.thread_id].votes;
	var answers = this.config[event.thread_id].answersText;
	var message = '';
	for (var v in votes) {
		message += answers[v] + ' \t→ ' + votes[v] + '\n';
	}
	api.sendMessage(this.config[event.thread_id].question + '\n', event.thread_id);
	api.sendMessage(message, event.thread_id);
};

exports.run = function(api, event) {
	var str = event.body.substr(5).trim();

	if (exports.isNumeric(str)) {
		return exports.castVote(api, event, parseInt(str));
	}

	if (str === '') {
		exports.print(api, event);
		return;
	}

	if (str === 'cancel') {
		if (!this.config[event.thread_id]) {
			api.sendMessage('Why did you think you could cancel a vote when one hasn\'t been cast? Stupid ' + event.sender_name.trim() + '!', event.thread_id);
		}
		else {
			clearTimeout(timer);
			delete this.config[event.thread_id];
			api.sendMessage('Vote cancelled.', event.thread_id);
		}
		return;
	}

	var spl = event.body.split('"');
	
	var timeout = -1;
	if (exports.isNumeric(spl[2].trim())) {
		timeout = parseInt(spl[2].trim());
	}
	
	var a = [];
	for (var i = 1; i < spl.length; i+=2) {
		a.push(spl[i]);
	}
	spl = a;
	
	if (spl.length < 3)  {
		api.sendMessage('WTF are you doing????!', event.thread_id);
		return;
	}

	exports.createVote(api, event, spl, timeout);
};

exports.unload = function() {
	if (timer) {
		clearTimeout(timer);
	}
};