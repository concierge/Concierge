node-giphy
==========

A wrapper for the giphy public API

Usage
-----

Use to query the giphy api

Get some fancy gifs already!

Currently implemented:

***Search***

Do a search for keywords

Params

	string keyword
	int limit (default 25, max 100)
	int offset

Recent

Examples
-------

```javascript

var giphy = require('giphy-wrapper')('YOUR_API_KEY');

giphy.search('otters', 10, 0, function (err, data) {
	if (err) {
		// check error
	}

	// use data, returns the data as an object
});
```

Test
----

```
make test
```