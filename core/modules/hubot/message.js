var Message = function(event, prefix) {
    this.event = event;
    this.prefix = prefix;

    this.room = event.thread_id;
    this.text = event.body;
    this.user = {
        name: event.sender_name,
        id: event.sender_id,
        email_address: 'concierge@foobar.com'
    };
};

module.exports = Message;
