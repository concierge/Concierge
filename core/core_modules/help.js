exports.match = function(text) {
  return text === this.commandPrefix + this.packageInfo.name
    || text === this.commandPrefix + 'help';
};

exports.run = function(api, event) {
  var help = packageInfo.nameTitle + ' '
      + this.packageInfo.version + '\n--------------------\n'
      + packageInfo.homepage +  '\n\n';

  for (var i = 0; i < loadedModules.length; i++) {
    help += loadedModules[i].help() + '\n';
  }
  
  api.sendMessage(help, event.thread_id);
  return false;
};
