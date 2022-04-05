const url = require("url");
var Message = require('./models/message');
var Room = require('./models/room');
var User = require('./models/user');

// chatroom router logic
var roomRouter = function (app) {
    // get all messages for rommId
    app.get('/api/messages', function (req, res) {
        console.info('/api/messages: ');
        if (req.session && req.session.userId) {
            const parsedUrl = url.parse(req.url, true);
            const query = parsedUrl.query;
            getMessages(req.session.userId, query.roomId, query.notViewed, function(data){
                res.send(data);
            });
        }
        else {
            res.status(401).send([]);
        }
    });

    app.get('/api/messages/setviewedall', function (req, res) {
        console.info('/api/messages/setviewedall: ');
        if (req.session && req.session.userId) {
            const parsedUrl = url.parse(req.url, true);
            const query = parsedUrl.query;
            var userId = req.session.userId;
            var q = { $and: [{ room: query.roomId }, { viewed: { $nin: [userId] } }, { user: { $ne: userId } }] };
            console.info('/api/messages/setviewedall: q = ' + JSON.stringify(q));
            Message.where(q).updateMany({ $push: { viewed: userId } }).exec(function (err, data) {
                    if (data && !err) {
                        console.info('/api/messages/setviewedall: ok - ' + JSON.stringify(data));
                        res.send(data);
                    }
                    else {
                        console.info('/api/messages/setviewedall: failed - ' + JSON.stringify(err));
                        res.send({});
                    }
                }
            );
        }
        else {
            res.status(401).send({});
        }
    });

    function getMessages(userId, roomId, notViewed, onDone) {
        var q = {};

        if (roomId && roomId.length > 0) {
            q = { room: roomId };            
        }
        
        if (notViewed) {
            q = { $and: [q, { viewed: { $nin: [userId] } }, { user: { $ne: userId } }] };
        }
        
        console.info('getMessages(): q = ' + JSON.stringify(q));
        
        Message.find(q)
            .populate({ path: 'user', select: '-password' })
            .sort({ date: 1 })
            .exec(function (err, data) {
                if (data && !err) {
                    console.info('getMessages: ' + data.length);
                    onDone(data);
                }
                else {
                    onDone([]);
                }
            }
        );
    }

    app.get('/api/messages/countnotviewed', function (req, res) {
        console.info('/api/messages: ');
        if (req.session && req.session.userId) {
            const parsedUrl = url.parse(req.url, true);
            const query = parsedUrl.query;
            getMessages(req.session.userId, query.roomId, true, function(data){
                res.send({ total: data.length});
            });
        }
        else {
            res.status(401).send({total: 0});
        }
    });

    // app.get('/api/messages', function (req, res) {
    //     console.info('/api/messages: ');
    //     if (req.session && req.session.userId) {
    //         var userId = req.session.userId;
    //         const parsedUrl = url.parse(req.url, true);
    //         const query = parsedUrl.query;
    //         var toId = query.toId;
    //         Message.find({
    //             $and: [
    //                 {
    //                     $or: [
    //                         { $and: [{ user: userId }, { to: { $in: [toId] } }] },
    //                         { $and: [{ user: toId }, { to: { $in: [userId] } }] },
    //                     ]
    //                 },
    //                 { deleted: { $nin: [userId] } }
    //             ]
    //         })
    //             .populate({ path: 'user', select: '-password' })
    //             .sort({ date: 1 })
    //             .exec(function (err, data) {
    //                 if (data && !err) {
    //                     console.info('/api/messages: ' + data.length);
    //                     res.send(data);
    //                 }
    //                 else {
    //                     res.send([]);
    //                 }
    //             }
    //             );
    //     }
    //     else {
    //         res.status(401).send([]);
    //     }
    // });

    function getNewMessagesCount(i, rooms, userId, onDone) {
        if (i < rooms.length) {
            var r = rooms[i];
            var q = { $and: [{ room: r._id }, { viewed: { $nin: [userId] } }, { user: { $ne: userId } }] };
            rooms[i].new_messages_count = 0;
            Message.find(q).exec(function (err, data) {
                if (data && !err) {
                    rooms[i].new_messages_count = data.length;
                }
                getNewMessagesCount(i+1, rooms, userId, onDone);
            });    
        }
        else {
            onDone(rooms);
        }
    }

    // return all rooms that user is part of 
    app.get('/api/rooms', function (req, res) {
        console.info('/api/rooms: ');
        if (req.session && req.session.userId) {
            var userId = req.session.userId;
            Room.find({ users: { $in: [userId] } })
                // .populate('messages')
                .populate('users')
                .exec(function (err, data) {
                    if (data && !err) {
                        console.info('/api/rooms: ' + data.length);
                        getNewMessagesCount(0, data, userId, function(data){ 
                            res.send(data);
                        });
                    }
                    else {
                        res.send([]);
                    }
                }
                );
        }
        else {
            res.status(401).send([]);
        }
    });

    // return a room that users and current user are in 
    app.post('/api/roomwith', function (req, res) {
        console.info('/api/roomwith: ');
        if (!req.session || !req.session.userId) {
            return res.status(401).send('Error - Please log in!');
        }
        var data = req.body;
        if (!data.users || !Array.isArray(data.users)) {
            res.status(400).send(null);
        }
        else {
            data.users.push(req.session.userId);
            console.info('/api/roomwith: ' + JSON.stringify(data));
            Room.findOne({ users: { $all: data.users } })
                .populate('users')
                .exec(function (err, data) {
                    if (data && !err) {
                        console.info('/api/roomwith: found room = ' + data);
                        res.send(data);
                    }
                    else {
                        console.info('/api/roomwith: not found ' + err);
                        res.send(null);
                    }
                }
                );
        }
    });

    // create a room
    app.post('/api/room/add', function (req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).send('Error - Please log in!');
        }
        var data = req.body;
        if (!data.users || !Array.isArray(data.users)) {
            res.status(400).send({});
        }
        else {
            data['users'].push(req.session.userId);
            console.info('/api/room/add: ' + JSON.stringify(data));
            Room.create(data, function (err, room) {
                if (room && !err) {
                    console.info('/api/room/add: ok - ' + JSON.stringify(room));
                    Room.findOne({ _id: room._id })
                        .populate('users')
                        .exec(function (err, newroom) {
                            if (newroom && !err) {
                                res.send(newroom);
                            }
                            else {
                                console.info('/api/room/add: failed to populate users...');
                                res.send(room);
                            }
                        }
                        );
                }
                else {
                    console.info('/api/room/add: failed - ' + JSON.stringify(err));
                    res.send(null);
                }
            });
        }
    });

    app.post('/api/messages/deleted/:id', function (req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).send('Error - Please log in!');
        }
        var msgId = req.params.id;
        var userId = req.session.userId;
        console.info('/api/messages/deleted/:id - msgId: ' + msgId + ", by: " + userId);
        Message.findByIdAndUpdate(msgId, { $push: { deleted: userId } }, function (err, doc) {
            if (doc && !err) {
                console.info('/api/deleteMessage: ok - ' + JSON.stringify(doc));
                res.send(doc);
            }
            else {
                console.info('/api/deleteMessage: failed - ' + JSON.stringify(err));
                res.send({});
            }
        })
    });

    app.post('/api/messages/viewed/:id', function (req, res) {
        if (!req.session || !req.session.userId) {
            return res.status(401).send('Error - Please log in!');
        }
        var msgId = req.params.id;
        var userId = req.session.userId;
        console.info('/api/messages/viewed/:id - msgId: ' + msgId + ", by: " + userId);
        Message.findByIdAndUpdate(msgId, { $push: { viewed: userId } }, function (err, doc) {
            if (doc && !err) {
                console.info('/api/viewedMessage: ok - ' + JSON.stringify(doc));
                res.send(doc);
            }
            else {
                console.info('/api/viewedMessage: failed - ' + JSON.stringify(err));
                res.send({});
            }
        })
    });

}

module.exports = roomRouter;