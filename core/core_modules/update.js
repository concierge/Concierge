var git = require.once('../git'),
	/**
	Default update period in milliseconds.
	Once per day.
	*/
	defaultUpdatePeriod = 86400000,
	timeout = null,
	updatePeriod = defaultUpdatePeriod,
	failedUpdateAttempts = 0,
	currentSHA = null,
	shutdown = null,

	checkForHash = function() {
		git.getSHAOfRemoteMaster(function(err, consoleOutput) {
			if (err) {
				console.debug('Failed to get SHA hash of remote origin/master\n Error: ' + consoleOutput);
				return false;
			}
			if (currentSHA !== consoleOutput) {
				currentSHA = consoleOutput;
				return true;
			}

			return false;
		});
	},

	setUpdateTimer = function() {
		timeout = setTimeout(function() {
			git.pull(function(err, consoleOutput) {
				// Well something is wrong if the update process has failed for 3 periods.
				// prevent restart and stop auto updating.
				if (failedUpdateAttempts > 2) {
					return;
				}

				if (err) {
					failedUpdateAttempts++;
					console.debug('Periodic auto update failed. Manual intervention is probably required.\n Error: ' + consoleOutput);
					setUpdateTimer();
					return;
				}

				if (checkForHash()) {
					shutdown(StatusFlag.ShutdownShouldRestart);
				}

				setUpdateTimer();
			});
		}, updatePeriod);
	};

exports.match = function(text, commandPrefix) {
	return text === commandPrefix + 'update';
};

exports.load = function() {
	var isEnabled = this.config.getConfig('update').autoUpdateEnabled,
		shutdown = this.shutdown,
		branchName;

	git.getCurrentBranchName(function (err, consoleOutput) {
		if (err) {
			console.debug('Failed to get current branch name\n Error: ' + consoleOutput);
			return;
		}
		branchName = consoleOutput.trim();
	});

	// Only allow auto update to be run on the master branch.
	// By default auto update is enabled but can be turned off in the config.
	if (branchName === 'master' && (isEnabled || isEnabled === undefined)) {
		var configUpdatePeriod = this.config.getConfig('update').autoUpdatePeriod;
		if (configUpdatePeriod) {
			updatePeriod = configUpdatePeriod;
		}
		git.getSHAOfHead(function (err, consoleOutput) {
			if (err) {
				console.debug('Failed to get SHA hash of HEAD\n Error: ' + consoleOutput);
				return;
			}
			currentSHA = consoleOutput;
		});
		setUpdateTimer();
	}
};

exports.unload = function() {
	if (timeout) {
		clearTimeout(timeout);
	}
	shutdown = null;
};

exports.run = function(api, event) {
	git.pull(function(err, consoleOutput) {
		if (err) {
			api.sendMessage('Update failed. Manual intervention is probably required.', event.thread_id);
		} else {
			api.sendMessage('Update successful. Restart to load changes.', event.thread_id);
		}
	});
	return false;
};
