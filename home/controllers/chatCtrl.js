// ------------------------------------------------------------------------------
// Copyright (c) 2018 - All Rights Reserved.
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.controller('chatCtrl', function ($rootScope, $scope, $state, $stateParams, $timeout, e3xUtil, e3xApi, e3xHelper, e3xChat, e3xSettings) {

    $scope.messages = [];
    $scope.response = "";
    $scope.room = $stateParams['room'];
    $scope.title = $scope.room['name'];
    
    $scope.$on('chat_message_received', function (event, data) {
        var room = data.room;
        if (room == $scope.room._id) {
            $scope.messages.push(data);
            $timeout(function(){
                $('#mcMessageContainer')[0].scrollTop = $('#mcMessageContainer')[0].scrollHeight;
            }, 100);
        } 
        else {
            e3xHelper.showToast('New message from ' + data.user.firstname + ": " + data.msg );
        }
    });

    $scope.$on('$viewContentLoaded', function (event) {
        var title = "";
        for(var i=0; i<$scope.room.users.length; i++) {
            var u = $scope.room.users[i];
            if (u._id != $rootScope.currentUser._id) {
                if (title.length > 0) title += ", ";
                title += u.firstname;
            }
        }
        $scope.title = "Chat with " + title;

        e3xApi.getMessages($scope.room._id, function(data){
            $scope.messages = data;
            $timeout(function(){
                e3xApi.setAllNewMessagesViewed($scope.room._id);
            }, 1000);
        });
    });

    $scope.sendMessage = function() {
        var txt = $scope.response;
        if (!e3xUtil.isNullOrEmpty(txt)) {
            $scope.response = "";
            e3xChat.sendMessage(txt, $scope.room._id, function(msg){
                // $scope.messages.push(msg);
            });
        }
    };

    $scope.close = function () {
        $state.go('main');
    };    

    $scope.onInputKeypress = function(evt) {
        if (evt.keyCode == 13) {
            evt.preventDefault();
            $scope.sendMessage();
        }
    };
});