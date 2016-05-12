var request = require.safe('request');

insults = ['You\'re asking the impossible',
    'It would help if you ask me something',
    'I don\'t have an answer for this',
    'The answer is 42',
    'What is the meaning of life'];


exports.yesOrNo = function (callback) {
   request.get('http://yesno.wtf/api', function(error, response, body) {
       if (response.statusCode === 200 && response.body) {
           var result = JSON.parse(response.body);
           if (result.image) {
               callback(result.image);
           }
           else {
               callback({error:'Well that was unexpected, api did not return an image.'});
           }
       }
       else {
           callback({error:'Whomever the system admin is around here, I demand that they should be fired.'});
       }
   });
};

exports.search = function (query, callback) {
    if (!query || query === '') {
        var index = Math.floor(Math.random() * insults.length);
        callback(insults[index] + ', try again');
    }
    else {
        exports.yesOrNo(callback);
    }
};

exports.run = function(api, event) {
    var query = event.arguments_body;
    exports.search(query, function(result) {
		api.sendImage("url", result, "Hmmmmmmm", event.thread_id);
    });
};
