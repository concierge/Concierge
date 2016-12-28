### CLI Options
There are a number of command line options that can be passed to Concierge.

- `--debug`/`-d`. Turns on verbose logging for Concierge. Useful for finding exact cause of an issue.
- `--log`/`-l`. Enables logging to a `concierge.log` file in the root of the project.
- `--timestamp`/`-t`. Enables timestamps in the console and log files. Note that these are Unix style timestamps (time since launch).
- `--language <locale>`/`-i`. Overrides the default language of Concierge, e.g. `en`.
- `--moduledir <directory>`/`-m`. Overrides the default module directory.
- `--help`/`-h`. Shows help for CLI arguments.

Example of usage:
`node main.js --debug --log test`
