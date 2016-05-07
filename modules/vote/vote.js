var timer,

createVote = function(api, event, spl, timeout) {
	var person = event.sender_name.trim();

	var response = person + ' called a new vote:\n\n' + spl[0] + '\n\nThe options are:\n';

	exports.config[event.thread_id] = {
		question: spl[0],
		answers: [],
		answersText: [],
		votes: {}
	};
	for (var i = 1; i < spl.length; i++) {
		response += i + '. ' + spl[i] + '\n';
        exports.config[event.thread_id].answers.push(i);
        exports.config[event.thread_id].answersText.push(spl[i]);
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
},

castVote = function(api, event, val) {
	var person = event.sender_name.trim();
	
	if (!exports.config[event.thread_id]) {
		api.sendMessage('No vote in progress. Stupid ' + person + '!', event.thread_id);
		return;
	}

	if (exports.config[event.thread_id].answers.indexOf(val) === -1) {
		api.sendMessage('I don\'t know what to say ' + person + ', that isn\'t even an option.', event.thread_id);
		return;
	}

	if (exports.config[event.thread_id][person]) {
		api.sendMessage('No, ' + person + ', you cannot vote more than once. Maybe I should deduct some karma...', event.thread_id);
		return;
	}

	val--;
	
	exports.config[event.thread_id][person] = true;
	if (!exports.config[event.thread_id].votes[val]) {
		exports.config[event.thread_id].votes[val] = 1;
	}
	else {
		exports.config[event.thread_id].votes[val]++;
	}

	api.sendMessage('Vote cast.', event.thread_id);
},

isNumeric = function(n) {
	// http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
	return !isNaN(parseFloat(n)) && isFinite(n);
},

print = function(api, event) {
	if (!exports.config[event.thread_id]) {
		api.sendMessage('No votes in progress?', event.thread_id);
		return;
	}
	var votes = exports.config[event.thread_id].votes;
	var answers = exports.config[event.thread_id].answersText;
	var message = '';
	for (var v in votes) {
		message += answers[v] + ' \t→ ' + votes[v] + '\n';
	}
	api.sendMessage(exports.config[event.thread_id].question + '\n', event.thread_id);
	api.sendMessage(message, event.thread_id);
};

exports.run = function (api, event) {
    if (event.arguments.length === 2) {
        if (isNumeric(event.arguments[1])) {
            return castVote(api, event, parseInt(event.arguments[1]));
        }
        else if (event.arguments[1] === 'cancel') {
            if (!exports.config[event.thread_id]) {
                api.sendMessage('Why did you think you could cancel a vote when one hasn\'t been cast? Stupid ' + event.sender_name.trim() + '!', event.thread_id);
            } else {
                clearTimeout(timer);
                delete exports.config[event.thread_id];
                api.sendMessage('Vote cancelled.', event.thread_id);
            }
            return;
        }
    }
    
    if (event.arguments.length < 4) {
        return print(api, event);
    }

    var timeout = -1;
    var start = 2;
    if (isNumeric(event.arguments[2])) {
        if (event.arguments.length < 5) {
            return print(api, event);
        }
        timeout = parseInt(event);
        start = 3;
    }
	
	var data = [event.arguments[1]];
	for (var i = start; i < event.arguments.length; i++) {
        data.push(event.arguments[i]);
	}
	
	if (data.length < 3)  {
		return api.sendMessage('WTF are you doing????!', event.thread_id);
	}

	createVote(api, event, data, timeout);
};

exports.unload = function() {
	if (timer) {
		clearTimeout(timer);
	}
};