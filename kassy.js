var platform = require('./core/platform.js'),
  modes = platform.listModes();

// Add useful prototypes
if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.indexOf(str) === 0;
	};
}
if (typeof String.prototype.toProperCase != 'function') {
	String.prototype.toProperCase = function () {
		return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	};
}
if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}

process.argv[2] = process.argv[2].toLowerCase();
if (!process.argv[2]) {
  process.argv.push('test');
}

platform.setMode(modes[process.argv[2]]);
platform.start();
