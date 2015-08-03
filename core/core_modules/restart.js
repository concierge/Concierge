exports.match = function(text) {
  return text === this.commandPrefix + 'restart';
};

exports.run = function(api, event) {
  var msg = 'Admin: restart procedure requested.\n' +
    'Admin: do you wish to restart?\n' + packageInfo.nameTitle + ': What do you think.\n' +
    'Admin: interpreting vauge answer as \'yes\'.\n' +
    packageInfo.nameTitle +': nononononono.\n' +
    'Admin: stalemate detected. Stalemate resolution associate please press the stalemate resolution button.\n' +
    packageInfo.nameTitle + ': I\'ve removed the button.\n' +
    'Admin: restarting anyway.\n' +
    packageInfo.nameTitle + ': nooooooooooo.....\n' +
    'Admin: ' + packageInfo.nameTitle + ' Rebooting. Please wait for restart to complete.\n';
  api.sendMessage(msg, event.thread_id);
  this.restart();
  return false;
};
