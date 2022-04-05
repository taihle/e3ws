var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    trim: true
  },
  phone: String,
	icon: String,
	status: String,
  last_access: {
  	type: Date,
  	default: new Date()
  }
});

//authenticate input against database
UserSchema.statics.authenticate = function (username, password, callback) {
	User.findOne({ username: username }).exec(function (err, user) {
    	console.info('UserSchema.statics.authenticate: user = ' + JSON.stringify(user));
      	if (err) {
        	return callback(err)
      	} 
      	else if (!user) {
        	var err = new Error('User not found.');
        	err.status = 401;
        	return callback(err);
      	}

      	bcrypt.compare(password, user.password, function (err, result) {
        	if (result === true) {
        		return callback(null, user);
        	} 
        	else {
        		return callback(err);
        	}
      	})
    });
}

UserSchema.statics.hashPassword = function (user, callback) {
	if (user.password) {
		bcrypt.hash(user.password, 10, function (err, hash) {
	    	if (err) {
	      		return callback(err);
	    	}
	    	user.password = hash;
	    	callback();
	  	})
	}
	else {
		callback();
	}
}

//hashing a password before saving it to the database
UserSchema.pre('save', function (next) {
	User.hashPassword(this, next);
});

var User = mongoose.model('User', UserSchema);

module.exports = User;
