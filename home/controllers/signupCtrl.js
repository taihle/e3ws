// ------------------------------------------------------------------------------
// Copyright (c) 2018 - All Rights Reserved.
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.controller('signupCtrl', function ($rootScope, $scope, $state, e3xLogger, e3xApi, e3xHelper) {

    $scope.user = {};
    $scope.error = '';

    $scope.close = function (ev) {
        $state.go('main');
    };

    $scope.signup = function (ev) {
        e3xLogger.debug("signup(): " + JSON.stringify($scope.user));
        e3xApi.addUser($scope.user,
            function (s) {
                e3xLogger.debug("signUp(): ok - " + JSON.stringify(s));
                $rootScope.currentUser = s;
                $state.go('main');
                e3xHelper.showAlertDialog(ev, 
                	{ title: "Welcome to E3 Cloud Service - " + s.firstname + " " + s.lastname, 
                	msg: "Please visit your Profile to update your pretty photo!"});
            },
            function (e) {
                $scope.error = e.data;
                e3xLogger.debug("signUp(): failed - " + JSON.stringify(e));
            }
        );        
    };
});
