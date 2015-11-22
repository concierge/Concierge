exports.match = function(text) {
  return text === this.commandPrefix + this.packageInfo.name
    || text === this.commandPrefix + 'help';
};

exports.run = function(api, event) {
  var help = this.packageInfo.name + ' '
      + this.packageInfo.version + '\n--------------------\n'
      + this.packageInfo.homepage +  '\n\n';

  for (var i = 0; i < this.loadedModules.length; i++) {
    help += this.loadedModules[i].help() + '\n';
  }
  
  api.sendMessage(help, event.thread_id);
  return false;
};
