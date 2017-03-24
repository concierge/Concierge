There are three different ways Concierge can be used. Each of these approaches are interchangeable, however have their own approaches to different tasks.

## Normal: `git clone`
This is the approach that you will see mostly throughout the documentation.

#### Directory Structure
- `main.js` this file is the main entry point for Concierge. Start Concierge using this, combined with [other CLI arguments](./Options.md).
- `core` directory. Contains the code of Concierge.
- `modules` directory. This is where you should place your modules (one per subdirectory).
    - `<some module>`
        - `config.json`. If using the default configuration module, module config will be stored here.
- `config.json`. If using the default configuration module, global config will be stored here.

#### Starting Concierge
Within a terminal/prompt use the following command (within the Concierge directory):

`node main.js <args...>`

## Global: `npm install -g`
Although similar to the documentation, this approach has a slightly different directory structure:

#### Directory Structure
- `<some module>` one or more modules installed in the current working directory, each as their own subdirectory.
    - `config.json`. If using the default configuration module, module config will be stored here.
- `config.json`. If using the default configuration module, global config will be stored here.

#### Starting Concierge
Most documentation refers to using `main.js` to start Concierge. With a global install, substitute `node main.js` for `concierge`, with all other arguments remaining the same. For example:

`node main.js test facebook` becomes `concierge test facebook`

## Local: `npm install`
If you want to make a standalone module, or want to do some tasks before/after startup outside of modules (or you just prefer to be different), Concierge can be required as in the following example:

```js
const concierge = require('concierge-bot');
const platform = concierge({
    modules: [
        '/some/path/to/a/module/test',
        '/some/other/path/to/module/ping'
    ],
    integrations: ['test'],
    locale: 'en',
    debug: 'verbose',
    timestamp: false,
    loopback: false
});
// do something with platform
```

Note that modules do not need to be loaded through the `require('concierge-bot')` function as in the above example, they can be passed to the module loader within Concierge at a later point if desired. All configuration values are optional.
