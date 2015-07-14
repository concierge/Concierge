/**
 * Heroic runner of possibly deadly code
 * @author sgress454
 */

// Node built-in sandboxing
var vm = require('vm');
var _ = require('lodash');

// Options for the worker
var workerOptions = {};

// If we received an argument, try to parse it as JSON
if (process.argv[2]) {
  try {
    workerOptions = JSON.parse(process.argv[2]);
  } catch (e) {
    workerOptions = {};
  }  
}

// If `workerOptions` isn't  a plain object, make it an empty one
if (!_.isPlainObject(workerOptions) || workerOptions === null) {
  workerOptions = {};
}

// If `workerOptions.requires` isn't a plain object, make it an empty one
if (!_.isPlainObject(workerOptions.requires) || workerOptions.requires === null) {
  workerOptions.requires = {};
}

// Attempt to require any modules that were passed in via workerOptions.require
// and add them to the default context
var defaultContext = {};
_.each(workerOptions.requires, function(path, contextKey) {
  try {
    defaultContext[contextKey] = require(path);  
  } catch(e) {}
});

// Add a `require` function to the default context that will just return
// the module from the context if we have it.
defaultContext.require = function(module) {
  if (defaultContext[module]) {return defaultContext[module];}
  throw new Error("Module " + module + "not included in Sandbox requires!");
};

// Register a handler for instructions from the airlock
process.on("message", function(taskOptions) {


  // Get the context we should run the script in
  var context = _.extend({}, defaultContext, taskOptions.context);

  // Get the script we're being ordered to run
  var script = taskOptions.script;

  var key = taskOptions.key;

  // Try to protect ourselves using try/catch
  try {

    // Let the quarantine know that we're about to start crunching.
    // This will start the self-destruct timer.
    process.send({
      status: "begun",
      key: key
    });

    // Attempt to run the script
    var result = vm.runInContext(script, vm.createContext(context));

    // If successful, send back the all-clear and the result
    process.send({
      status: "ok",
      result: result,
      key: key
    });
  } 

  catch (e) {

    // If the script failed, send back an error status and message
    process.send({
      status: "script_error",
      result: e.message,
      key: key
    });
  }

});