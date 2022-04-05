// ------------------------------------------------------------------------------
// Copyright (c) 2018 - All Rights Reserved.
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.controller('settingsCtrl', function ($scope, $state, e3xUtil, e3xLogger, e3xSettings) {

    $scope.data = { 
        chatserver: e3xSettings.getChatServerUrl(),
        zipcode: e3xSettings.getZipCode()
    };
    
    $scope.close = function () {
        $state.go('main');
    };

    $scope.save = function (ev) {
        e3xLogger.debug("settingsCtrl.save(): ");
        e3xSettings.setChatServerUrl($scope.data.chatserver);
        e3xSettings.setZipCode($scope.data.zipcode);
        $scope.close();
    };
});
