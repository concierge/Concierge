var request = require('request');

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str){
        return this.indexOf(str) === 0;
    };
}

exports.match = function(text) {
    return text.startsWith('/8ball');
};

exports.help = function() {
    return '/8ball <query> : Answers your questions to life.';
};

insults = ['Your asking the impossible',
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
    var result;

    //TODO waiting for update to anim to use same api to embed images in fb chat.
    if (query === undefined || query === '') {
        var index = Math.floor(Math.random() * insults.length);
        result = callback(insults[index] + ', try again');
    }
    else {
        result = exports.yesOrNo(callback);
    }
};

exports.run = function(api, event) {
    var query = event.body.substr(6);
    exports.search(query, function(result) {
        api.sendMessage(result, event.thread_id);
    });
};

exports.load = function() {};