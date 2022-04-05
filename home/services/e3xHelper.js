// ------------------------------------------------------------------------------
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.service('e3xHelper', ['$mdToast', '$mdDialog',
    function ($mdToast, $mdDialog) {
        var self = this;

    self.showToast = function(content) {
        $mdToast.show(
            $mdToast.simple()
            .content(content)
            .position('top right')
            .hideDelay(2500)
        );
    };        

    self.showConfirmDialog = function(ev, title, text, onDone, okLabel, cancelLabel) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
              .title(title)
              .textContent(text)
//              .ariaLabel('Lucky day')
              .targetEvent(ev)
              .ok(okLabel ? okLabel : 'Ok')
              .cancel(cancelLabel ? cancelLabel : 'Cancel');
    
        $mdDialog.show(confirm).then(function() {
            onDone(true);
        }, function() {
            onDone(false);
        });
      };

    self.showLoginDialog = function (ev, onDone) {
        var useFullScreen = false;
        $mdDialog.show({
          controller: 'loginCtrl',
          templateUrl: 'views/login-dialog.template.html',
          parent: angular.element(document.body),
          targetEvent: event,
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        })
        .then(credentials => {
            if (onDone) {
                onDone(credentials);
            }
        },
        () => {
            if (onDone) {
                onDone(false);
            }
            }
        );
    };

    self.showAlertDialog = function(ev, data) {
      // Appending dialog to document.body to cover sidenav in docs app
      // Modal dialogs should fully cover application
      // to prevent interaction outside of dialog
      $mdDialog.show(
        $mdDialog.alert()
          .parent(angular.element(document.querySelector('#popupContainer')))
          .clickOutsideToClose(true)
          .title(data.title)
          .textContent(data.msg)
          .ariaLabel(data.title)
          .ok(data.ok ? data.ok : 'Got it!')
          .targetEvent(ev)
      );
    };
    
}]);