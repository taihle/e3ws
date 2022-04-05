const multer = require('multer');
var User = require('./models/user');
var Message = require('./models/message');

// portalRouter logic
var portalRouter = function (app) {
	app.get('/api/user', function (req, res) {
	    console.info('/api/user:');
	    if (req.session && req.session.userId) {
  			User.findById(req.session.userId).exec(function (err, user) {
      			if (err) {
      				res.status(401).send({error:'invalid user session'});
      			} 
      			else {
        			if (user === null) {
	      				res.status(400).send({error:'invalid user session'});
					}
					else {
						user.password = undefined;
						res.status(200).send(user);
					}
				}
        	});
        } 
        else {
        	res.status(400).send({error:'invalid user session'});
        }
    });

	app.post('/api/user/login', function (req, res) {
	    console.info('/api/user/login: ' + JSON.stringify(req.body));
    	User.authenticate(req.body.username, req.body.password, function (err, user) {
	      	if (err || !user) {
	      		res.status(401).send('Wrong username and/or password.');
			} 
			else {				
	        	req.session.userId = user._id;
				user.password = undefined;
	        	res.status(200).send(user);
	      	}
    	});
	});

	app.post('/api/user/changepassword', function (req, res) {
	    console.info('/api/user/changepassword: ' + JSON.stringify(req.body));
    	User.authenticate(req.body.username, req.body.password, function (err, user) {
	      	if (err || !user) {
	      		res.status(401).send('Wrong username and/or current password.');
			} 
			else {
				var id = user._id;
				var data = { password: req.body.new_password };
			    // console.info('/api/user/changepassword: before = ' + JSON.stringify(data));
				User.hashPassword(data, function() {
					// console.info('/api/user/changepassword: after = ' + JSON.stringify(data));
					User.findOneAndUpdate({ _id: id }, { $set: data }).exec(function(err, user) {
					   	if(err) {
					   		console.info('/api/user/changepassword: error - ' + JSON.stringify(err));
					       	res.status(500).send(err);
					   	} 
					   	else {
					   		console.info('/api/user/changepassword: ok!');
					   		user.password = undefined;
							res.status(200).send(user);
					   	}
					});
				});
	      	}
    	});
	});

	app.get('/api/user/logout', function (req, res) {
	    console.info('/api/user/logout: ');
		if (req.session) {
	    	// delete session object
	    	req.session.destroy(function (err) {
		      	if (err) {
		        	res.status(500).send(err);
		      	} 
		      	else {
		        	res.status(200).send({});
		      	}
		   	});
	  	}
	});

	app.post('/api/user/add', function(req, res) {
		console.log('/api/user/add: ' + JSON.stringify(req.body));
	   	User.create(req.body, function (err, user) {
	    	if (err) {
				if (err.code == 11000) { // duplicated username
					err = "Error 11000 - User already registered!";
				}
				res.status(500).send(err);
	      	} else {
	        	req.session.userId = user._id;
	        	user.password = undefined;
	        	res.status(200).send(user);
	      	}
	    });
	});

	function checkSignIn(req, res){
	   if (req.session.userId) {
	      next();     //If session exists, proceed to page
	   } else {
	      var err = new Error("Not logged in!");
	      console.log(req.session.user);
	      next(err);  //Error, trying to access unauthorized page!
	   }
	}

	app.post('/api/user/update', function (req, res) {
		if (req.session.userId) {
		    var data = req.body;
		    data.last_access = new Date();
		    console.info('/api/user/update: ' + JSON.stringify(data));
		    var id = data._id;
		    delete data.username;
		    delete data._id;
		    console.info('/api/user/update: pw before = ' + data.password);
			User.hashPassword(data, function() {
				console.info('/api/user/update: pw after = ' + data.password);
				User.findOneAndUpdate({ _id: id }, { $set: data }).exec(function(err, user) {
				   	if(err) {
				   		console.info('/api/user/update: error - ' + JSON.stringify(err));
				       	res.status(500).send(err);
				   	} 
				   	else {
				   		user.password = undefined;
						res.status(200).send(user);
				   	}
				});
			});
		}
		else {
			res.status(401).send('Session timeout!');
		}
	});

	var multer_storage = multer.diskStorage({
		destination: function(req,file,callback){
			callback(null, 'storage/images');
		},
		filename: function(req,file,callback){
			console.info("multer_storage.filename():\nfile = " + JSON.stringify(file));
			var filename = req.session.userId;
			callback(null, filename + '.png');
		}
	});
	
	var multer_upload = multer({ storage: multer_storage }).single('file');
	
	app.post('/api/upload', function (req, res) {
		console.info('/api/upload:');
		if (req.session && req.session.userId) {
			var userId = req.session.userId;
			multer_upload(req, res, function(err){
				if(err){
					console.info('/api/upload: failed - ' + JSON.stringify(err));
					res.status(500).json({success: false, msg:'Image uploaded failed'});
					return;
				}
				var filePath = "/storage/images/" + userId + ".png";
				if (userId) {
					User.findOneAndUpdate({_id: userId}, { $set: { icon: filePath} }, function (err, user) {
						if (err) {
							res.status(500).json({ success: false, msg: 'Image uploaded failed', filePath: filePath });
						}
						else {
							res.status(200).json({ success: true, msg: 'Image uploaded successfully', filePath: filePath });
						}
					});
				}
				else {
					res.status(200).json({ success: true, msg: 'Image uploaded successfully', filePath: filePath });
				}
			})
		}
		else {
			res.status(403).send({ success: false, msg:'not logged in!'});
		}
	});

	app.get('/api/users', function (req, res) {
		console.info('/api/users:');
		if (req.session && req.session.userId) {
			var userId = req.session.userId;
			var q = {};
			if (req.query.xme) {
				q = { $and: [ q, { _id: { $ne: userId } } ] };
			}
			User.find(q)
				.select(["-password","-__v"])
				.exec(function(err, docs){
					if (docs && !err) {
						console.info('/api/users: ' + docs.length);
						res.send(docs);
					}
					else {
						res.send([]);
					}
				}
			);
		}
		else {
			res.status(403).send([]);
		}
	});

}

module.exports = portalRouter;