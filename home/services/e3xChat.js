// ------------------------------------------------------------------------------
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.service('e3xChat', ['e3xLogger', function (e3xLogger) {
    e3xLogger.info("::e3xChat::");
    var self = this;

    self._user = null;
    self._socket = {};
    self.onMessageReceived = null;
    self.onUserStatusUpdated = null;
    
    self.openSocket = function(server) {
        if (self._socket && self._socket.connected) {
            return;
        }

        self._socket = io(server); // , { "connect timeout": 5000 });

        self._socket.on('e3xChat.socket.connect_failed', function (data) {
            self.closeSocket();
        });
    
        self._socket.on('reconnect_failed', function (data) {
            e3xLogger.info("e3xChat.socket.reconnect_failed(): " + JSON.stringify(data));
            self.closeSocket();
        });
    
        self._socket.on('error', function (data) {
            e3xLogger.info("e3xChat.socket.error(): " + JSON.stringify(data));
            self.closeSocket();
        });
    
        self._socket.on('custom_error', function (data) {
            e3xLogger.info("e3xChat.socket.custom_error(): " + JSON.stringify(data));
            self.closeSocket();
        });
    
        self._socket.on('disconnect', function (data) {
            e3xLogger.info("e3xChat.socket.disconnect(): " + JSON.stringify(data));
            self.closeSocket();
        });
    
        self._socket.on('connect_timeout', function (data) {
            e3xLogger.info("e3xChat.socket.connect_timeout(): " + JSON.stringify(data));
            self.closeSocket();
        });
    
        self._socket.on('reconnecting', function (data) {
            e3xLogger.info("e3xChat.socket.reconnecting(): " + JSON.stringify(data));
            //TODO: do something
            // Main chat title, add the loading bar and text
            //main_chat_title( 2 );
        });
    
        self._socket.on('connecting', function (data) {
            e3xLogger.info("e3xChat.socket.connecting(): " + JSON.stringify(data));
            // Main chat title, add the loading bar and text
            // main_chat_title(2);
        });
    
        self._socket.on('connect', function (data) {
            e3xLogger.info("e3xChat.socket.connect(): " + JSON.stringify(data));
        });
    
        self._socket.on('chat', function (data) {
            e3xLogger.info("e3xChat.socket.chat(): " + data);
            self.handleIncoming(JSON.parse(data));
        });
    };

    self.closeSocket = function() {
        e3xLogger.info("e3xChat.closeSocket(): ");
        if (self._socket) {
            self._socket.disconnect();
            self._socket = null;
        }
    };

    self.init = function (user, server, onDone) {
        e3xLogger.info("e3xChat.init():");
        self._user = user;
        self._server = server;
        self._init(onDone);
    }

    self._init = function (onDone) {
        self.openSocket(self._server);
        self.join(self._user);
        if (onDone) onDone();
    };

    self.join = function(user, onDone) {
        self._socket.emit('join', user._id, function (data) {
            e3xLogger.info("e3xChat.join(): " + data);
            var recv = JSON.parse(data);
            if (recv.login == 'successful') {
                //   user_name = recv.my_settings.name;
                //   user_avatar = recv.my_settings.avatar;

                //   setTimeout(function () {
                //     main_chat_title( 0 );
                //     main_chat_status(i18n.connected, 'online' );
                //   }, 700);
            }
            else {
                e3xLogger.info("e3xChat.join(): failed");
            }
        });
    };

    self.sendMessage = function (msg, roomId, onDone) {
        if (!self._socket) {
            self._init(function(){
                self.sendMessage(msg, roomId, onDone);
            });
        }
        else {
            var data = { user_id: self._user._id, msg: msg, room: roomId };
            self._socket.emit('message', data, function (data) {
                var recv = JSON.parse(data);
                if (onDone) {
                    var resp = recv;
                    onDone(resp);
                }
            });
        }
    };

    // self.sendMessage = function (msg, sendto_user, onDone) {
    //     if (!self._socket) {
    //         self._init(function(){
    //             self.sendMessage(msg, sendto_user, onDone);
    //         });
    //     }
    //     else {
    //         var data = { user: self._user, msg: msg };
    //         if (sendto_user && sendto_user._id) {
    //             data['sendto'] = [sendto_user._id]; // array of usernames
    //         }
    //         self._socket.emit('message', data, function (data) {
    //             var recv = JSON.parse(data);
    //             if (onDone) {
    //                 var resp = recv;
    //                 onDone(resp);
    //             }
    //         });
    //     }
    // };

    self.handleIncoming = function (recv) {
        var action = recv.action;

        e3xLogger.info("e3xChat.handleIncoming(): action = " + action);

        if (action == 'message') {
            if (self.onMessageReceived) {
                self.onMessageReceived(recv);
            }
        }
        else if (action == 'newuser' || action == 'disconnect' || action == 'offline' || action == 'user_status') {
            if (self.onUserStatusUpdated) {
                self.onUserStatusUpdated(recv);
            }
        }
        else if (action == 'user_typing') {
            //   var userid = recv.data.uid;
            //   var main = $( "#Dialog" + userid );

            //   if ( main.parent().find( "#iswriting" ).first().hasClass( "no-display") ) {

            //     main.parent().find( "#iswriting" ).first().removeClass( "no-display" );

            //     setTimeout(function () {
            //       main.parent().find( "#iswriting" ).first().addClass( "no-display" );
            //     }, 2000);
            //   }
        }
        // Update my setting from backend
        else if (action == 'update_settings') {
            //   user_name = recv.data.name;
            //   user_avatar = recv.data.avatar;
        }
        else if (action == 'usrlist') {
            //   for (i in recv.user) {

            //     //Append the Dialogid
            //     main_append_dialog( recv.user[i].uid, recv.user[i].user );
            //     main_set_dialog( recv.user[i].uid, recv.user[i].user );

            //     //Append the user to chat
            //     main_chat_user_new( recv.user[i].uid, recv.user[i].status, recv.user[i].name );
            //   }
        }
        else {
            e3xLogger.info("e3xChat.handleIncoming(): not handled " + action);
        }
    }
    
}]);
