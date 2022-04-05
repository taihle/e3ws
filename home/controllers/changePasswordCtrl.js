// ------------------------------------------------------------------------------
// Copyright (c) 2018 - All Rights Reserved.
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.controller('changePasswordCtrl', function ($rootScope, $scope, $mdDialog, e3xLogger, e3xApi) {

    $scope.user = { username: $rootScope.currentUser.username };
    $scope.showHints = false;
    $scope.error = "";

    $scope.close = function () {
        $mdDialog.cancel();
    };

    $scope.changePassword = function (ev) {   
        e3xLogger.debug("changePassword(): " + JSON.stringify($scope.user));
        if ($scope.user.password == $scope.user.new_password) {
            $scope.error = "Current password is the same as new password!";
            return;
        }
        e3xApi.changePassword($scope.user,
            function (s) {
                e3xLogger.debug("changePassword(): ok - " + JSON.stringify(s));
                $mdDialog.hide(s);
            },
            function (f) {
                $scope.error = f.data;
            }
        );
    };

    $scope.hide = function() {
        $mdDialog.hide();
    };
});
