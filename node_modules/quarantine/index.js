/**
 * Coordinate quarantine of dangerous code using a worker
 * @author sgress454
 */

/**
 * Module dependencies
 */
var path = require('path');
var fork = require('child_process').fork;
var _ = require('lodash');

// Allowable time for worker to run before timing out
var timeout = 250;

// Options such as the number of workers to keep in the pool, and default sandbox 
// settings for each worker
var quarantineOptions = {};

// Pool of workers
var workers = {};

// Queue of tasks
var queue = [];

// Flag to indicate that the quarantine needs to be rebooted
var killed = false;

/**
 * Set up the global quarantine environment
 *
 * There is only one quarantine environment per process, which manages the worker pool.
 *
 * Options: 
 * numWorkers {integer} Number of workers to keep in the pool.  Each worker is a node process, 
 *                      so be mindful of resource usage and note that it doesn't make sense to
 *                      have more workers than CPU cores.
 * requires {object} Hash of module name => module path that each worker should make available as
 *                   both local variables in the sandbox, and as modules accessible with the sandboxed
 *                   "require()" function
 * 
 * @param  {integer} _timeout Time (in milliseconds) that a worker should be allowed to run before being killed.  Overrideable on a per-task basis.
 * @param  {object} _options Various other environment options (see above)
 * @return {[type]}          [description]
 */
module.exports = function(_timeout, _options) {

  // Kill any active workers and queue, in case quarantine was loaded previously
  kill();

  // Set the timeout to whatever the user desires, or the default
  timeout = _timeout || timeout;

  // Set the options to whatever was passed in, or an empty object
  quarantineOptions = _options || {};

  // Set the number of simultaneous workers to allow
  quarantineOptions.numWorkers = quarantineOptions.numWorkers || 1;

  // Mark that we're now alive, unlocking the "run" function
  killed = false;

  // Return a reference to the run function
  return run;

};


/**
 * Given a context, script and cb, run the script in a sandbox
 * @param  {object}   context The context that the script should run in 
 * @param  {string}   script  The script to run
 * @param  {Function} cb      Callback to return results from the script execution
 */
function run(context, script, taskOptions, cb) {

  // If the quarantine has been killed, we can't run it again until it's properly reset
  if (killed) {
    throw new Error("Quarantine was killed; require('quarantine') again to restart.");
  }

  // Make context optional
  if (typeof context !== 'object') {
    cb = taskOptions;
    taskOptions = script;
    script = context;
    context = {};
  }

  // Make taskOptions optional
  if (typeof taskOptions == 'function') {
    cb = taskOptions;
    taskOptions = {};
  }

  // Merge in default sandbox context
  context = _.defaults(context || {}, quarantineOptions.context);

  // Sanitize taskOptions
  taskOptions = _.pick(taskOptions || {}, ['timeout']);

  // Make cb optional
  if (typeof cb !== 'function') {
    cb = function(){};
  }

  // Handle to a worker to use for this task 
  var worker;

  // Try to find a free worker
  if (!_.any(workers, function(candidateWorker) {
    if (!candidateWorker.busy) {
      worker = candidateWorker;
      return true;
    } 
  })) 

  // Otherwise if we haven't reached our worker limit, spin one up
  {
    if (_.keys(workers).length < quarantineOptions.numWorkers) {
      worker = spinUpWorker();
    } 

    // Else add the job to the queue and return
    else {
      queue.push({context: context, script: script, options: taskOptions, cb: cb});
      return;
    }
  }

  // If we found a worker to use, give it the task
  _run(worker, context, script, taskOptions, cb);

}


function kill() {
  // Kill all the workers
  _.each(workers, function(worker) {
    // Make sure to remove all listeners first
    worker.removeAllListeners();
    worker.kill('SIGHUP');
  });
  // Clear the pool
  workers = {};
  // Clear the queue and options
  queue = [];
  timeout = 0;
  // Flag that the quarantine was killed
  killed = true;

}

run.kill = kill;


function _run(worker, context, script, taskOptions, cb) {

  // Flag the worker as busy so it doesn't accept new tasks
  worker.busy = true;

  // Self-destruct timer
  var selfDestruct;

  // Generate a random key to identify this task
  var key = Math.random();

  // Spin up a worker if we don't have one
  if (!worker) {spinUpWorker();}

  // Handle messages coming back from the worker
  worker.on("message", handleWorkerMessage);
  // Handle the worker dying an untimely death
  worker.on("exit", handleWorkerExit);

  // Give the worker its marching orders
  worker.send({context: context, script: script, key: key});

  // Handler a return message from the worker
  function handleWorkerMessage(result) {

    // If this message isn't about the task we're waiting for, ignore it.
    // This should never happen at this point, since workers should only
    // be handling one task at a time.
    if (result.key !== key) {return;}

    // If the message is "begun", we'll start the countdown
    if (result.status == "begun") {
      // Set up a timeout--if the worker takes to long, we'll
      // tell the caller that it failed and respawn it
      selfDestruct = setTimeout(function() {

        // Remove all the handlers from this (possibly locked, about to be dead) worker
        worker.removeListener("message", handleWorkerMessage);
        worker.removeListener("exit", handleWorkerExit);

        // Kill the worker with extreme prejudice--it'll be respawned automatically
        // by the handler bound in spinUpWorker()
        worker.kill('SIGKILL');

        // Let the caller know it didn't work out
        var timeoutError = new Error("Worker timed out!");
        timeoutError.code = 'E_WORKER_TIMEOUT';
        return cb(timeoutError);

      }, taskOptions.timeout || timeout);

      return;
    }

    // Clear the self-destruct
    clearTimeout(selfDestruct);

    // Clear the current handlers from the worker
    worker.removeListener("message", handleWorkerMessage);
    worker.removeListener("exit", handleWorkerExit);

    // If we get the all clear, return the result of running the script
    if (result.status == 'ok') {
      cb(null, result.result);
    } else {
      // Otherwise it was just a regular error in the evaluated code
      cb(new Error(result.result));      
    }

    // If there are any more jobs in the queue, pop one off and run it.
    if (queue.length) {
      var nextJob = queue.pop();
      _run(worker, nextJob.context, nextJob.script, nextJob.options, nextJob.cb);
    } 
    // Otherwise set the worker as idle
    else {
      worker.busy = false;
    }

  }  

  // Handle the worker dying in the line of duty.
  // 
  // Note that it'll be automatically respawned by the on('exit') event handler
  // inside of spinUpWorker
  function handleWorkerExit() {

    // Clear the self-destruct timeout; worker already died
    clearTimeout(selfDestruct);

    // Clear the current handlers from the worker
    worker.removeListener("message", handleWorkerMessage);
    worker.removeListener("exit", handleWorkerExit);

    // Return an error to the caller
    var workerError = new Error("Worker died!");
    workerError.code = 'E_WORKER_DEATH';
    return cb(workerError);

  }

}

// Spin up a new worker
function spinUpWorker() {
  // Fork the worker process, using the stringfied options as argument
  var worker = fork(path.resolve(__dirname, "worker.js"), [JSON.stringify({requires: quarantineOptions.requires})]);
  // Remove listener limit for the worker
  worker.setMaxListeners(0);
  // Give the worker a random ID
  worker.id = Math.random();
  // Add the worker to the pool
  workers[worker.id] = worker;
  // If the worker dies, remove it from the pool and respawn
  worker.on('exit', function() {
    delete workers[worker.id];
    var newWorker = spinUpWorker();
    if (queue.length) {
      var nextJob = queue.pop();
      _run(newWorker, nextJob.context, nextJob.script, nextJob.options, nextJob.cb);
    }
  });

  return worker;

}

// Before quarantine dies, kill the worker
process.on('exit', function() {
  _.each(workers, function(worker) {worker.kill('SIGHUP');});
});

