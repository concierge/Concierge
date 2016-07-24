### Debugging CLI Options
There are two debugging related command line options that can be passed to Concierge.

- `--debug`. Turns on verbose logging for Concierge. Useful for finding exact cause of an issue.
- `--log`. Enables logging to a `concierge.log` file in the root of the project.
- `--timestamp`. Enables timestamps in the console and log files. Note that these are Unix style timestamps (time since launch).
- `--language <code>`. Language to start bot as.
- `--help`. Shows help for CLI arguments.

Example of usage:
`node main.js --debug --log test`
