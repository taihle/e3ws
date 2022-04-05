var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
  user: { 
    type: Schema.ObjectId, 
    ref: 'User',
    required: true
  },
  room: {
    type: Schema.ObjectId, 
    ref: 'Room'
  },  
  subject: String,
  msg: String,
  date: {
    type: Date,
    required: true,
    default: new Date()
  },
  viewed: [{ 
    type: Schema.ObjectId, 
    ref: 'User'
  }],
  deleted: [{ 
    type: Schema.ObjectId, 
    ref: 'User'
  }]
});

var Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
