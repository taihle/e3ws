// ------------------------------------------------------------------------------
// Copyright (c) 2018 - All Rights Reserved.
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.controller('loginCtrl', function ($scope, $mdDialog, e3xLogger, e3xApi) {

    $scope.username;
    $scope.password;
    $scope.error = '';

    $scope.close = function () {
        $mdDialog.cancel();
    };

    $scope.login = function () {    
        e3xApi.login({ username: this.username, password: this.password },
            function (s) {
                e3xLogger.debug("login(): ok - " + JSON.stringify(s));
                if (s && s.username) {
                    $mdDialog.hide(s);
                }
                else {
                    this.error = "Unknow Error!"
                }
            },
            function (f) {
                $scope.error = f.data;
            }
        );            
    };

    $scope.forgotPassword = function() {
        e3xApi.resetPassword({}, function(r){
            this.error = r;
        });
    };

    $scope.hide = function() {
        $mdDialog.hide();
    };
});
