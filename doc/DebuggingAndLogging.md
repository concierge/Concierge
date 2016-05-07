### Debugging CLI Options
There are two debugging related command line options that can be passed to Kassy.

- `--debug`. Turns on verbose logging for Kassy. Useful for finding exact cause of an issue.
- `--log`. Enables logging to a `kassy.log` file in the root of the project.
- `--timestamp`. Enables timestamps in the console and log files. Note that these are unix style timestamps (time since launch).

Example of usage:
`node main.js --debug --log test`
