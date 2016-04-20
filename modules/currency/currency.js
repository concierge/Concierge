var request = require.safe('request');

exports.match = function(text, commandPrefix) {
    return text.startsWith(commandPrefix + '8ball');
};

exports.help = function() {
    return [[this.commandPrefix + 'currency <number> <from-currency> in <to-currency>','Converts between currencies.']];
};

exports.get_exchange = function(callback) {
  request.get('http://api.fixer.io/latest', function(error, response, body) {
       if (response.statusCode === 200 && response.body) {
           var result = JSON.parse(response.body);
       }
       else {
           callback({error:"Couldn't talk to fixer.io for the exchange rate.."});
       }
   });
}

exports.run = function(api, event) {
    var query = event.body.substr(9),
        parts = query.split(' ');
    
    //If we don't have the right number of parts, give up
    if (parts.length !== 4) {
      api.sendMessage("That looks wrong. You should try harder.", event.thread_id);
      return;
    }

    this.get_exchange(function (result) {
      //If we couldn't get the latest data, give up.
      if (result.error) {
        api.sendMessage(result.error, event.thread_id);
        return;
      }

      //Add an entry for the Euro
      result.rates.EUR = 1;
      result = this.convert(parts[1], parts[3], parseInt(parts[0]), result.rates);

      //If we couldn't convert, give up
      if (result.error) {
        api.sendMessage(result.error, event.thread_id);
        return;
      }

      api.sendMessage("I think it's about " + result.result + parts[3])
    });
};

exports.convert = function(from, to, amount, conversions) {
  if (!conversions[from]) {
    return {error: "Unsupported currency '" + from + "'" };
  }

  if (!conversions[to]) {
    return {error: "Unsupported currency '" + to + "'" };
  }

  return {result: amount/from * to }
}
