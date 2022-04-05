var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RoomSchema = new Schema({
  name: String,
  users: [{ 
    type: Schema.ObjectId, 
    ref: 'User'
  }],
  new_messages_count: Number,
  messages: [{ 
    type: Schema.ObjectId, 
    ref: 'Message'
  }]
});

var Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
