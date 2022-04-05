var User = require('./models/user');
var Message = require('./models/message');
var Room = require('./models/room');

// chat router logic
var chatRouter = function (http) {
    var _socks = {};

    var io = require('socket.io')(http);

    io.on('connection', function (socket) {
        console.log('a user connected ' + socket);

        // Event received by new user
        socket.on('join', function (user_id, fn) {
            console.log('socket - join - user_id = ' + user_id);

            User.findOne({ _id: user_id }, function (err, user) {
                if (user && !err) {
                    if (!_socks[user_id]) {
                        _socks[user_id] = [];
                    }
                    else {
                        console.log('socket - join - same user has logged in from other connections: ' + _socks[user_id].length);
                    }

                    // If there is users online, send the list of them
                    var user_ids = Object.keys(_socks);
                    if (user_ids.length > 0) {
                        socket.emit('chat', JSON.stringify({ 'action': 'usrlist', 'users': user_ids }));
                    }

                    socket.user_id = user_id;
                    _socks[user_id].push(socket);

                    // Send new user is connected to everyone
                    updateUserStatus(socket.user_id, 'online');
                    user.status = 'online';
                    socket.broadcast.emit('chat', JSON.stringify({ 'action': 'newuser', 'user': user }));

                    if (typeof fn !== 'undefined') {
                        fn(JSON.stringify({ 'login': 'successful', 'my_settings': user }));
                    }
                }
                else {
                    socket.emit('custom_error', { message: 'User not found or invalid' });
                    if (typeof fn !== 'undefined') {
                        fn(JSON.stringify({ 'login': 'failed - invalid user' }));
                    }
                }
            })
        });

        // Event received when user want change his status
        socket.on('user_status', function (user) {
            console.log('socket - user_status');
            // if (users[socket.user_id]) {
            //     users[socket.user_id].status = user.status;
            //     socket.broadcast.emit('chat', JSON.stringify({ 'action': 'user_status', 'user': users[socket.user_id] }));
            // }
        });

        // Event received when user is typing
        socket.on('user_typing', function (user) {
            console.log('socket - user_typing ' + socket.id);
            // var socket_id = _socks[user._id].socket.id;
            // io.sockets.connected[socket_id].emit('chat', JSON.stringify({ 'action': 'user_typing', 'data': users[socket.user_id] }));
        });

        // Event received when user send message to another
        socket.on('message', function (recv, fn) {
            console.log('socket - message ' + socket.id);
            var d = new Date();
            if (typeof fn !== 'undefined') {
                fn(JSON.stringify({ 'ack': 'true', 'date': d }));
            }

            saveMessageToDatabase(recv, d, function (room, data) {
                if (!room || !data) {
                    return;
                }
                var sent_data = JSON.stringify(data);
                for (var i = 0; i < room.users.length; i++) {
                    var user_id = room.users[i]._id;
                    if (_socks[user_id]) {
                        var user_connections = _socks[user_id].length;
                        console.log('socket - message: send message to user ' + room.users[i].username + ', ' + user_connections + ' connections');
                        if (user_connections > 0) {
                            for (let j = 0; j < user_connections; j++) {
                                let socket_id = _socks[user_id][j].id;
                                let connected_socket = io.sockets.connected[socket_id];
                                if (connected_socket) {
                                    connected_socket.emit('chat', sent_data);
                                }
                                else {
                                    console.log('socket - message: user connection disconnected ' + socket_id);
                                }
                            }    
                        }
                        else {
                            updateUserStatus(user_id, 'offline'); 
                        }
                    }
                    else {
                        console.log('socket - message: user offline ' + room.users[i].username);
                    }
                }
            });
        });

        // Event received when user has disconnected
        socket.on('disconnect', function () {
            let user_id = socket.user_id;
            console.log('socket - disconnect ' + user_id + '/' + socket.id);
            if (_socks[user_id]) {
                for (let i = _socks[user_id].length - 1; i >= 0; i--) {
                    let socket_id = _socks[user_id][i].id;
                    let connected_socket = io.sockets.connected[socket_id];
                    if (!connected_socket) {
                        console.log('socket - disconnected ' + socket_id);
                        _socks[user_id].splice(i, 1);
                    }
                }

                if (_socks[user_id].length <= 0) {
                    updateUserStatus(socket.user_id, 'offline', function (user) {
                        console.log('socket - disconnect - updated user.status = ' + user.status);
                        // find a socket that is connected 
                        var user_ids = Object.keys(_socks);
                        var sent_data = JSON.stringify({ 'action': 'disconnect', 'user': user });
                        for (var i = 0; i < user_ids.length; i++) {
                            var other_user_id = user_ids[i];
                            if (socket.user_id != other_user_id) {
                                for (let j = 0; j < _socks[other_user_id].length; j++) {
                                    let socket_id = _socks[other_user_id][j].id;
                                    console.log('socket - disconnect: send message to user ' + other_user_id + '/' + socket_id);
                                    var connected_socket = io.sockets.connected[socket_id];
                                    if (connected_socket) {
                                        connected_socket.emit('chat', sent_data);
                                    }
                                    else {
                                        console.log('socket - disconnect: other user connection dicconnected ' + other_user_id + '/' + socket_id);
                                    }
                                }
                            }
                        }
                    });
                }
                else {
                    console.log('socket - disconnect - there is still ' + _socks[user_id].length + ' connections from this user!');

                }
            }
        });
    });

    function updateUserStatus(userId, status, onDone) {
        console.info('updateUserStatus(' + userId + ',' + status + '): ');
        User.findOneAndUpdate({ _id: userId }, { $set: { 'status': status } }).exec(function (err, user) {
            if (err) {
                console.info('updateUserStatus(): error - ' + JSON.stringify(err));
            }
            else {
                console.info('updateUserStatus(): ok - ' + user.status);
            }
            if (typeof onDone !== 'undefined') {
                if (user.status != status) {
                    console.info('updateUserStatus(): this is weir...');
                    user.status = status;
                }
                onDone(user);
            }
        });
    };

    function saveMessageToDatabase(recv, d, onDone) {
        var data = { 'user': recv.user_id, 'room': recv.room, 'msg': recv.msg, 'date': d };
        Message.create(data, function (err, msg) {
            if (msg && !err) {
                console.log('saveMessageToDatabase(): ok');
                Room.findOne({ _id: recv.room })
                    .populate('users')
                    .exec(function (err, room) {
                        if (room && !err) {
                            console.log('saveMessageToDatabase(): found room ' + room._id);
                            data['action'] = 'message';
                            for (var i = 0; i < room.users.length; i++) {
                                if (room.users[i]._id == recv.user_id) {
                                    data['user'] = room.users[i];
                                    console.log('saveMessageToDatabase(): sender = ' + data['user'].firstname);
                                    break;
                                }
                            }
                            onDone(room, data);
                        }
                        else {
                            console.log('saveMessageToDatabase(): room not found ' + recv.room);
                            onDone(null);
                        }
                    });
            }
            else {
                console.log('saveMessageToDatabase(): failed - ' + JSON.stringify(err));
                onDone(null);
            }
        });
    };
}

module.exports = chatRouter;