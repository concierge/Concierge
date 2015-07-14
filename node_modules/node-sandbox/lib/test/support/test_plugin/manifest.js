module.exports = {
    name: "test_plugin", //the name of the parent directory our plugin is in
    provides: [], //features that it provides. This is flexible, so it can be something like "container" or "rpc".
    conflicts: [], //features or specific plugins this plugin conflicts with.
    depends: [] //features or specific plugins that this plugin requires to run.
}
