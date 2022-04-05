// ------------------------------------------------------------------------------
// Copyright (c) 2018 - All Rights Reserved.
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.controller('fileUploadCtrl', function ($rootScope, $scope, $mdDialog, $timeout, Upload, e3xLogger, e3xApi) {

    $scope.user = $rootScope.currentUser;
    $scope.file = {};
    $scope.uploadStatus = "Choose a file...";
    
    $scope.uploadFile = function (file) { // (dataUrl, name) {
        if (!file || !file.size) return;
        $scope.uploadStatus = "Uploading...";
        Upload.upload({
            url: '/api/upload',
            data: {
                userid: $rootScope.currentUser._id,
                file: file // Upload.dataUrltoBlob(file.$ngfBlobUrl, file.name)
            },
        }).then(function (response) {
            $timeout(function () {
                // $scope.result = response.data;
                $scope.uploadStatus = "Uploaded!";
                if (response.data && response.data.filePath) {
                    $timeout(function() {
                        $rootScope.currentUser.icon = response.data.filePath + "?v=" + (new Date()).getTime();                     
                        $mdDialog.hide(response.data);
                    }, 1000);
                }
            }, 1000);
        }, function (response) {
            if (response.status > 0) {
                $scope.uploadStatus = "Error: " + response.status; // + ' - ' + response.data;
            }
        }, function (evt) {
            $scope.uploadStatus = parseInt(100.0 * evt.loaded / evt.total) + "%";
        });
    }

    $scope.close = function () {
    	$mdDialog.cancel();
    };

  	$scope.hide = function() {
    	$mdDialog.hide();
  	};
});
