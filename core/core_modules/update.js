var git = require.once('../git.js'),
	install = require('../install.js'),
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
					console.critical(err);
					console.debug('Periodic auto update failed. Manual intervention is probably required.\n Error: ' + consoleOutput);
					setUpdateTimer();
				}
				else {
					git.submoduleUpdate(function(err) {
						if (err, consoleOutput) {
							console.critical(err);
							console.debug('Periodic auto git submodule update failed. Manual intervention is probably required.\n Error: ' + consoleOutput);
						}
						else {
							try {
								install.update();
							}
							catch (e) {
								console.critical(e);
								api.sendMessage('Periodic auto update of NPM packages failed. Manual NPM intervention will be required.', event.thread_id);
							}
						}

						if (checkForHash()) {
							shutdown(StatusFlag.ShutdownShouldRestart);
						}

						setUpdateTimer();
					});
				}
			});
		}, updatePeriod);
	};

exports.match = function(event, commandPrefix) {
	return event.body === commandPrefix + 'update';
};

exports.load = function() {
	var isEnabled = null,
		branchName;

	isEnabled = this.config.getConfig('update').autoUpdateEnabled;
	shutdown = this.shutdown;

	git.getCurrentBranchName(function (err, consoleOutput) {
		if (err) {
			console.debug('Failed to get current branch name\n Error: ' + consoleOutput);
			return;
		}
		branchName = consoleOutput.trim();
	});

	// Only allow auto update to be run on the master branch.
	// By default auto update is enabled but can be turned off in the config.
	if (branchName === 'master' && (isEnabled || isEnabled === null)) {
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

exports.run = function (api, event) {
	api.sendMessage('Updating from git...', event.thread_id);
	git.pull(function(err) {
		if (err) {
			console.critical(err);
			api.sendMessage('Update failed. Manual intervention is probably required.', event.thread_id);
		} else {
			api.sendMessage('Updating submodules', event.thread_id);
			git.submoduleUpdate(function(err) {
				if (err) {
					console.critical(err);
					api.sendMessage('Updating submodules failed. Manual intervention is required', event.thread_id);
				}
				else {
					api.sendMessage('Updating installed NPM packages...', event.thread_id);
					try {
						install.update();
						api.sendMessage('Update successful. Restart to load changes.', event.thread_id);
					}
					catch (e) {
						console.critical(e);
						api.sendMessage('Update succeeded but NPM package update failed. Manual intervention is probably required.', event.thread_id);
					}
				}
			});
		}
	});
	return false;
};

exports.help = function(commandPrefix) {
	return [[commandPrefix + 'update', 'Updates the platform to the latest version on master', 'Also update npm dependencies, periodic automatic updates are enabled by default.']];
};
