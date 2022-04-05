// ------------------------------------------------------------------------------
// Copyright (c) 2018 - All Rights Reserved.
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.controller('bootCtrl', function ($rootScope, $http, $state, e3xSettings, e3xLogger, e3xChat, e3xHelper) {
    
    // for icon, image, ect...
    $rootScope.absImagePathUrl = e3xSettings.getChatServerUrl() + "/";

    updateWeatherInfo();

    function updateWeatherInfo() {
        try {
            var zipcode = e3xSettings.getZipCode();
            var url = e3xSettings.getChatServerUrl() + "/wi?loc=" + zipcode;
            $http.get(url).then(function (res) {
                if (res.data && res.data[zipcode]) {
                    var wic = res.data[zipcode].current;
                    var now = Math.floor((new Date()).getTime() / 1000);
                    var day_or_night = "wu";
                    if (now > wic.sunset) day_or_night = "night";
                    $rootScope.wi = Math.floor(wic.temp_f)
                        + "&deg;&nbsp;" + "<i class='wi wi-" + day_or_night + "-" + wic.icon + "'></i>";
                }
            });
        }
        catch (err) { }
    };

    e3xChat.onMessageReceived = function(data) {
        if ($state.current.name != 'chat') {
            e3xHelper.showToast('New message from ' + data.user.firstname + ": " + data.msg );
        }
        $rootScope.$broadcast("chat_message_received", data); 
    }

    e3xChat.onUserStatusUpdated = function(data) {
        $rootScope.$broadcast("chat_user_status_updated", data); 
    }

    $rootScope.initChatService = function() {
        e3xLogger.debug("initChatService(): ");        
        e3xChat.init($rootScope.currentUser, e3xSettings.getChatServerUrl(), function() {        
            e3xLogger.debug("initChatService(): ");    
        });
    };

    $rootScope.resetChatService = function() {
        e3xLogger.debug("resetChatService(): ");
        e3xChat.closeSocket();
    };



});
