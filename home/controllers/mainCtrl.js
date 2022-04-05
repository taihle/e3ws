// ------------------------------------------------------------------------------
// Copyright (c) 2018 - All Rights Reserved.
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.controller('mainCtrl', function ($rootScope, $scope, $state, $mdSidenav, e3xLogger, e3xHelper, e3xApi, e3xUtil) {

    $scope.$on('$viewContentLoaded', function (evt) {
    	if (!$rootScope.currentUser) {
			e3xApi.relogin(function(user){
                $rootScope.currentUser = user;
                populateContactsList();
                populateRoomsList();
                $rootScope.initChatService();
			});
        }
        else {
            populateContactsList();
            populateRoomsList();
        }
    });

    $scope.gotoMain = function (ev) {
        $state.go('main');
    };

    $scope.signUp = function (ev) {
        $state.go('signup');
    };

    $scope.viewProfile = function (ev) {
        $state.go('profile');
    };

    $scope.viewMessages = function (ev) {
        $state.go('chat');
    };

    $scope.viewSettings = function (ev) {
        $state.go('settings');
    };

    $scope.startChatRoom = function (ev, room) {
        $state.go('chat', { room: room });
    };

    $scope.startChat = function (evt, contact) {
        if ($scope.enableCreateRoom) {
            var contactIds = getSelectedContactIds();
            if (contactIds.length > 1) {
                e3xHelper.showConfirmDialog(evt, "Group Chat", "Group chat with " + contactIds.length + " contacts?", function(ok){
                    if (ok) {
                        $scope.enableCreateRoom = false;
                        startChatRoomWithContactIds(contactIds);
                    }
                } );
            }
            else {
                $scope.enableCreateRoom = false;
                startChatRoomWithContactIds([contact._id]);
            }
        }
        else {
            startChatRoomWithContactIds([contact._id]);
        }
    };
    
    function startChatRoomWithContactIds(contactIds) {
        e3xApi.getRoomWith(contactIds, function(room){
            if (room) {
                updateRoomNameIcon(room);
                $state.go('chat', { room: room });
            }
            else {
                e3xApi.createRoom(contactIds, function(room){
                    populateRoomsList(room, function(room){
                        $state.go('chat', { room: room });
                    });
                });
            }
        })
    }

    $scope.login = function (ev) {
        e3xHelper.showLoginDialog(ev, function (credentials) {
            if (credentials) {
                $rootScope.currentUser = credentials;
                // TODO - $state.go('boot');
                $rootScope.$broadcast('login_changed');
                e3xHelper.showToast('Thanks for logging in, ' + (credentials.firstname ? credentials.firstname : credentials.username));
                populateContactsList();
                populateRoomsList();
                $rootScope.initChatService();
            }
        });
    };

    $scope.logoff = function (ev) {
        console.log("logoff");
        e3xApi.logout(function () {
            $rootScope.currentUser = undefined;
            $rootScope.$broadcast('login_changed');
            $rootScope.resetChatService();
            $scope.contacts = [];
            $scope.rooms = [];
        });
    };

    $scope.openUserMenu = function ($mdMenu, ev) {
        originatorEv = ev;
        $mdMenu.open(ev);
    };

    $scope.toggleSidenav = buildToggler('sidenavleft');

    function buildToggler(componentId) {
        return function () {
            $mdSidenav(componentId).toggle();
        };
    }

    function populateContactsList() {
        e3xApi.getContacts(function(data){
            $scope.contacts = data;
        });
    }

    function updateRoomNameIcon(room) {
        var title = "";
        for(var i=0; i<room.users.length; i++) {
            if (i > 0) {
                if (i == room.users.length - 1) {
                    title += " & ";
                }
                else {
                    title += ", ";
                }
            }
            title += room.users[i].firstname;
            if (room.users[i]._id != $rootScope.currentUser._id) {
                room['to'] = room.users[i];
            }
        }
        if (e3xUtil.isNullOrEmpty(room['name'])) {
            room['name'] = title;
        }
    }

    function populateRoomsList(room_to_update, onDone) {
        e3xApi.getRooms(function(data){
            for(var r = 0; r < data.length; r++) {
                var room = data[r];
                updateRoomNameIcon(room);
                if (e3xUtil.isNullOrEmpty(room['name'])) {
                    room['name'] = title;
                }
                if (room_to_update && room_to_update._id == room._id) {
                    room_to_update = room;
                    break;
                }
            }
            $scope.rooms = data;
            if (onDone) {
                onDone(room_to_update);
            }
        });
    }

    $scope.$on('chat_message_received', function (event, data) {
        var roomId = data.room;
        $scope.rooms.forEach(r => {
            if (r._id == roomId) {
                r.new_messages_count++;
            }
        });
    }); 
    
    $scope.$on('chat_user_status_updated', function (event, data) {
        e3xLogger.debug("mainCtrl.$on('chat_user_status_updated'): " + data);
    });    

    $scope.createRoom = function(evt) {
        if ($scope.selectedIndex != 1) {
            $scope.selectedIndex = 1;
        }

        if (!$scope.enableCreateRoom) {
            $scope.enableCreateRoom = true;            
            e3xHelper.showToast('Please select some contacts...');
            return;
        }

        var contactIds = getSelectedContactIds();
        if (contactIds.length > 1) {
            e3xHelper.showConfirmDialog(evt, "Group Chat", "Group chat with " + contactIds.length + " contacts?", function(ok){
                if (ok) {
                    $scope.enableCreateRoom = false;
                    startChatRoomWithContactIds(contactIds);
                }
                else {
                    $scope.enableCreateRoom = false;
                }
            } );
        }
        else if (contactIds.length == 0) {
            $scope.enableCreateRoom = false;
        }
        else {
            e3xHelper.showToast('Please select more than 1 contact to form a group!');
        }
    }

    function getSelectedContactIds() {
        var contactIds = [];
        $scope.contacts.forEach(c => { if (c.selected) contactIds.push(c._id); });
        return contactIds;
    }   
    
});
