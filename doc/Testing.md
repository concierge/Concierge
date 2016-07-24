## Tests

Tests can be run using one of the following grunt tasks.

Most grunt tasks will first launch a testing instance of the bot, to perform acceptance testing against.

| Command | Description | Launches testing Instance |
| --- | --- | --- |
| `grunt` | Watches core for changes and runs tests | Yes |
| `grunt test` | Runs all tests | Yes |
| `grunt wall` | Watches core and tests folders for changes and runs tests | Yes |
| `grunt wcore` | Watches core for changes and runs tests | Yes |
| `grunt wtest` | Watches tests for changes and runs tests | Yes |

For examples on writing acceptance tests see [tests/acceptance/test_core_modules.js]
