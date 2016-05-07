exports.match = function (event, commandPrefix) {
    if (event.arguments[0] === commandPrefix + 'associate') {
        return true;
    }
    
	var s = event.body.toLowerCase();
	for (var assoc in exports.config[event.thread_id]) {
        if (s.indexOf(assoc.toLowerCase()) !== -1) {
            if (!event.__associateCmd) {
                event.__associateCmd = {
                    thread: event.thread_id,
                    responses: []
                };
            }
            event.__associateCmd.responses.push(exports.config[event.thread_id][assoc]);
		}
	}
	return !!event.__associateCmd;
};

var toggleAssociation = function(thread, hook, text) {
    hook = hook.toLowerCase();
    if (!text) {
        if (exports.config[thread] && exports.config[thread][hook]) {
            delete exports.config[thread][hook];
        }
        return false;
    }

    if (!exports.config[thread]) {
		exports.config[thread] = {};
	}
	exports.config[thread][hook] = text;
	return true;
},

printAssociations = function(api, event) {
	var assoc = exports.config[event.thread_id];
	var message = '';
	for (var a in assoc) {
		message += a + ' → ' + assoc[a] + '\n';
	}
	message.trim();
	api.sendMessage(message, event.thread_id);
},

clear = function(api, event) {
	exports.config[event.thread_id] = {};
	api.sendMessage('Associations cleared.', event.thread_id);
};

exports.run = function (api, event) {
    var isCommand = event.arguments[0] === api.commandPrefix + 'associate';
	if (isCommand && event.arguments.length === 1) {
		return printAssociations(api, event);
	}
    
	if (isCommand && event.arguments[1] === 'clear') {
		return clear(api, event);
	}
    
    if (!isCommand && event.__associateCmd) {
        for (var i = 0; i < event.__associateCmd.responses.length; i++) {
            api.sendMessage(event.__associateCmd.responses[i], event.__associateCmd.thread);
        }
        return;
    }
    
    if (event.arguments.length !== 2 && event.arguments.length !== 3) {
        return api.sendMessage('WTF are you doing????!', event.thread_id);
    }

	toggleAssociation(event.thread_id, event.arguments[1], event.arguments[2]);
	api.sendMessage('Association changed.', event.thread_id);
};
