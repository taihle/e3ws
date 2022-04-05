// ------------------------------------------------------------------------------
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.service('e3xApi', ['$http', 'e3xLogger', 'e3xSettings', function ($http, e3xLogger, e3xSettings) {
    var self = this;

    self._url = e3xSettings.getChatServerUrl() + "/api/";

    self.relogin = function (onSuccess, onError) {
        $http.get(self._url + "user").then(
            function (res) {
                onSuccess(res.data);
            },
            onError
        );
    };

    self.login = function (data, onSuccess, onError) {
        $http.post(self._url + "user/login", data).then(
			function (res) {
			    onSuccess(res.data);
			},
            onError
		);
    };

    self.logout = function (onDone) {
        $http.get(self._url + "user/logout").then(
            function (res) {
                onDone()
            },
            onDone
        );
    };

    self.changePassword = function (data, onSuccess, onError) {
        $http.post(self._url + "user/changepassword", data).then(
            function (res) {
                onSuccess(res.data);
            },
            onError
        );
    }; 

    self.resetPassword = function (data, onSuccess, onError) {
        $http.post(self._url + "messages/sms", data).then(
            function (res) {
                onSuccess(res.data);
            },
            onError
        );
    };

    self.getContacts = function (onDone) {
        $http.get(self._url + "users?xme=true").then(function (res) { onDone(res.data); });
    };

    self.addUser = function (data, onSuccess, onError) {
        $http.post(self._url + "user/add", data).then(
			function (res) {
				onSuccess(res.data);
            },
            onError
		);
    };

    self.updateUser = function (data, onSuccess, onError) {
        $http.post(self._url + "user/update", data).then(
            function (res) {
                onSuccess(res.data);
            },
            function (err) {
                onError(err.status + " - " + err.statusText);
            }
        );
    };

    self.getMessages = function(roomId, onDone) {
        $http.get(self._url + "messages?roomId="+roomId).then(function (res) {
            onDone(res.data);
        });
    };

    self.sendMessage = function(toId, msg, onDone) {
        $http.post(self._url + "messages/add", {to_id: toId, body: msg}).then(
            function (res) {
                onDone(res.data);
            },
            function (err) {
                onDone(err.status + " - " + err.statusText);
            }
        );
    };

    self.deleteMessage = function(msgId, onDone) {
        $http.post(self._url + "messages/delete/" + msgId).then(
            function (res) {
                onDone(res.data);
            },
            function (err) {
                onDone(err.status + " - " + err.statusText);
            }
        );
    };

    self.setAllNewMessagesViewed = function(roomId, onDone) {
        $http.get(self._url + "messages/setviewedall?roomId=" + roomId).then(
            function (res) {
                if(onDone) onDone(res.data);
            },
            function (err) {
                if(onDone) onDone(err.status + " - " + err.statusText);
            }
        );
    };

    self.getRooms = function(onDone) {
        $http.get(self._url + "rooms").then(
            function (res) {
                onDone(res.data);
            },
            function (err) {
                onDone(err.status + " - " + err.statusText);
            }
        );
    };    

    self.getRoomWith = function(users, onDone) {
        $http.post(self._url + "roomwith", {users: users}).then(
            function (res) {
                onDone(res.data);
            },
            function (err) {
                onDone(null);
            }
        );
    };    

    self.createRoom = function(users, onDone) {
        $http.post(self._url + "room/add", {users: users}).then(
            function (res) {
                onDone(res.data);
            },
            function (err) {
                onDone(err.status + " - " + err.statusText);
            }
        );        
    }

    
}]);

