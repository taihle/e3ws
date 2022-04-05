// ------------------------------------------------------------------------------
// Copyright (c) 2018 - All Rights Reserved.
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.controller('profileCtrl', function ($rootScope, $scope, $state, $timeout, $mdDialog, Upload, e3xLogger, e3xApi) {

    $scope.user = $rootScope.currentUser;
	$scope.profilePictureFiles = {};
	
	$scope.toggleCheckbox = function (item, list) {
    	var idx = list.indexOf(item);
    	if (idx > -1) {
      		list.splice(idx, 1);
    	}
    	else {
      		list.push(item);
    	}
  	};

  	$scope.existsCheckbox = function (item, list) {
    	return list.indexOf(item) > -1;
  	};

  	$scope.isIndeterminateActivities = function() {
    	return ($scope.user.activities.length !== 0 
    		&& $scope.user.activities.length !== $scope.activities.length);
  	};

  	$scope.isCheckedAllActivities = function() {
    	return ($scope.user.activities.length === $scope.activities.length);
  	};

  	$scope.toggleAllActivities = function() {
    	if ($scope.user.activities.length === $scope.activities.length) {
      		$scope.user.activities = [];
    	} 
    	else if ($scope.user.activities.length === 0 || $scope.user.activities.length > 0) {
      		$scope.user.activities = $scope.activities.slice(0);
    	}
  	};

    this.close = function () {
        $state.go('main');
    };

    this.save = function () {
        e3xLogger.debug("save(): " + JSON.stringify($scope.user));
        e3xApi.updateUser($scope.user,
            function (s) {
                e3xLogger.debug("updateUser(): ok - " + JSON.stringify(s));
                $state.go("startup");
            },
            function (f) {
                e3xLogger.debug("updateUser(): failed - " + JSON.stringify(f));
            }
        );        
    };

    this.changePassword = function(ev) {
        $mdDialog.show({
          controller: 'changePasswordCtrl',
          templateUrl: 'views/change-password-dialog.template.html',
          parent: angular.element(document.body),
          targetEvent: event,
          clickOutsideToClose: true
        })
        .then(result => {
            e3xLogger.debug("changePassword(): result = " + JSON.stringify(result));
            }
        );
    };

    this.changeProfilePicture = function() {
    	var useFullScreen = false;
	    $mdDialog.show({
	      controller: 'fileUploadCtrl',
	      templateUrl: 'views/file-upload-dialog.template.html',
	      parent: angular.element(document.body),
	      targetEvent: event,
	      clickOutsideToClose: true,
	      fullscreen: useFullScreen
	    })
	    .then(file => {
	    	e3xLogger.debug("uploadfile(): " + JSON.stringify(file));
			}
		);    	
    };

    this.uploadProfilePicture = function(ev) {
    	e3xLogger.debug("uploadProfilePicture(): ");
        Upload.upload({
            url: '/api/upload',
            data: {
                userid: $scope.user._id,
                file: $scope.profilePictureFiles // Upload.dataUrltoBlob(file.$ngfBlobUrl, file.name)
            },
        }).then(function (response) {
            $timeout(function () {
                $scope.result = response.data;
                // $rootScope.currentUser.icon = undefined;
                if (response.data.filePath) {
                    $timeout(function() {
                        $scope.uploadStatus = "Upload completed.";
                        $rootScope.currentUser.icon = response.data.filePath + "?v=" + (new Date()).getTime();                     
                    }, 1000);                
                }
            }, 1000);
        }, function (response) {
            if (response.status > 0) {
                $scope.errorMsg = response.status + ': ' + response.data;
            }
        }, function (evt) {
            $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
        });
    };
});
