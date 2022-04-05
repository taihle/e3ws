// ------------------------------------------------------------------------------
// Copyright (c) 2018 - All Rights Reserved.
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.controller('sendMessageCtrl', function ($scope, $mdDialog, e3xLogger, e3xApi) {

    this.close = function () {
    	$mdDialog.cancel();
    };

    this.hide = function() {
        $mdDialog.hide();
    };

    this.send = function () {
    	e3xLogger.debug("");
    };
});
