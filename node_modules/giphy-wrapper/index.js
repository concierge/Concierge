var http = require('http');

var GiphyApiWrapper = function (api_key) {
  this._base_url = 'api.giphy.com';
  this._api_version = 'v1';
  this._api_key = api_key;
};

// Endpoints //

// Recent
// Example request http://api.giphy.com/v1/gifs/recent?api_key=dc6zaTOxFJmzC&tag=ryan-gosling
GiphyApiWrapper.prototype.recent = function (tag, limit, callback) {
  var tag = tag || null,
    limit = limit || 10,
    path = 'gifs/recent';

  var args = new Array('limit=' + limit);
  
  if (tag !== null) {
    args.push('tag=' + limit);
  }

  args = args.join('&');

  this._call(path, args, callback);
};

// Limit max 100, default 25
GiphyApiWrapper.prototype.search = function (query, limit, offset, callback) {
  var query = query || null,
    limit = limit || 25,
    offset = offset || 0,
    path = 'gifs/search';
  
  var args = new Array(
    'q=' + query,
    'limit=' + limit,
    'offset=' + offset
  ).join('&');

  if (query === null) {
    callback(new Error('No query'), null);
    return;
  }

  this._call(path, args, callback);
}

// Internal //

// API call wrapper
GiphyApiWrapper.prototype._call = function (path, args, callback) {
  var path = this._buildPath(path, args);

  this._request(this._base_url, path, function (err, data) {
    if (err) {
      return callback(err, null);
    }

    return callback(null, JSON.parse(data));
  });
}

GiphyApiWrapper.prototype._buildPath = function (path, args) {
  var path = '/' + this._api_version + '/' + path;
  path += '?api_key=' + this._api_key;
  path += '&' + args;

  return path;
}

GiphyApiWrapper.prototype._request = function (host, path, callback) {
  var options = {
    hostname: host,
    port: 80,
    path: path,
    method: 'GET'
  }

  var req = http.request(options, function (res) {
    res.setEncoding('utf8');
    if (res.statusCode !== 200) {
      console.log('error', res.statusCode);
      return callback(new Error('Request failed'), null);
    }

    var data = [];

    res.on('data', function (chunk) {
      // Has chunk of data
      data.push(chunk);
    }).on('end', function () {
      data_string = data.join('');
      return callback(null, data_string);
    });
  });

  // Catch error on request
  req.on('error', function(e) {
    return callback(new Error(e.message), null);
  });

  req.end();
}

module.exports = function (api_key) {
  return new GiphyApiWrapper(api_key);
}
