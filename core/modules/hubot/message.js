var Message = function (event, prefix) {
    this.event = event;
    this.prefix = prefix;
    
    this.message = this;
    this.text = event.body;
    this.user = {
        name: event.sender_name,
        id: event.sender_id,
        email_address: 'kassy@foobar.com'
    };
};

module.exports = Message;