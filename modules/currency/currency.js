var request = require.safe('request');

exports.run = function(api, event) {
    var query = event.body.substr(10),
        parts = query.split(' ');

    //If we don't have the right number of parts, give up
    if (parts.length !== 4) {
        api.sendMessage("That looks wrong. You should try harder.", event.thread_id);
        return;
    }

    get_exchange(function (result) {
        //If we couldn't get the latest data, give up.
        if (result.error) {
          api.sendMessage(result.error, event.thread_id);
          return;
        }

        //Add an entry for the Euro
        result.rates.EUR = 1;
        result = convert(parts[1], parts[3], parseInt(parts[0]), result.rates);

        //If we couldn't convert, give up
        if (result.error) {
          api.sendMessage(result.error, event.thread_id);
          return;
        }

        api.sendMessage("It's about " + result.result + ' ' + parts[3]);
    });
};

function convert(f, to, amount, conversions) {
    if (!conversions[f]) {
        return {
            error: "Unsupported currency '" + f + "'"
        };
    }

    if (!conversions[to]) {
        return {
            error: "Unsupported currency '" + to + "'"
        };
    }

    var a = amount/conversions[f] * conversions[to];
    a = Math.round(a*100) / 100;

    return {
        result: a
    };
}

function get_exchange(callback) {
    request.get('http://api.fixer.io/latest', function(error, response, body) {
        if (response.statusCode === 200 && response.body) {
            var result = JSON.parse(response.body);
            callback(result);
        }
        else {
            callback({error:"Couldn't talk to fixer.io for the exchange rate.."});
        }
     });
}
