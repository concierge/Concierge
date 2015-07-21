var platform = require('./core/platform.js'),
  modes = platform.listModes();

process.argv[2] = process.argv[2].toLowerCase();
if (!process.argv[2]) {
  process.argv.push('test');
}

platform.setMode(modes[process.argv[2]]);
platform.start();
