e3xApp.directive('e3xPassword', function(){
    return {
        require: 'ngModel',
        link: function(scope, element, attr, mCtrl){
            mCtrl.$parsers.push(function(value){
                var aryValue = value.split("");
                var isChar = false, isDigit = false;

                aryValue.forEach(function(element, index, array){
                    if (Number.isInteger(parseInt(element))){
                        isDigit = true;
                    }else{
                        isChar = true;
                    }
                })

                mCtrl.$setValidity('e3xPassword', isDigit && isChar);

                return value;
            });
        }
    };
});

e3xApp.directive('compareTo', function(){
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel){
            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };

            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
});

e3xApp.directive('phoneInput', function($filter, $browser) {
    return {
        require: 'ngModel',
        link: function($scope, $element, $attrs, ngModelCtrl) {
            var listener = function() {
                var value = $element.val().replace(/[^0-9]/g, '');
                $element.val($filter('tel')(value, false));
            };

            // This runs when we update the text field
            ngModelCtrl.$parsers.push(function(viewValue) {
                return viewValue.replace(/[^0-9]/g, '').slice(0,10);
            });

            // This runs when the model gets updated on the scope directly and keeps our view in sync
            ngModelCtrl.$render = function() {
                $element.val($filter('tel')(ngModelCtrl.$viewValue, false));
            };

            $element.bind('change', listener);
            $element.bind('keydown', function(event) {
                var key = event.keyCode;
                // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
                // This lets us support copy and paste too
                if (key == 91 || (15 < key && key < 19) || (37 <= key && key <= 40)){
                    return;
                }
                $browser.defer(listener); // Have to do this or changes don't get picked up properly
            });

            $element.bind('paste cut', function() {
                $browser.defer(listener);
            });
        }

    };
});

e3xApp.filter('tel', function () {
    return function (tel) {

        if (!tel) { return ''; }

        var value = tel.toString().trim().replace(/^\+/, '');

        if (value.match(/[^0-9]/)) {
            return tel;
        }

        var country, city, number;

        switch (value.length) {
            case 1:
            case 2:
            case 3:
                city = value;
                break;

            default:
                city = value.slice(0, 3);
                number = value.slice(3);
        }

        if(number){
            if(number.length>3){
                number = number.slice(0, 3) + '-' + number.slice(3,7);
            }
            else{
                number = number;
            }

            return ("(" + city + ") " + number).trim();
        }
        else{
            return "(" + city;
        }

    };
});

// e3xApp.directive('e3xScrollBottom', ['$timeout', function ($timeout) {
//     return {
//       scope: {
//         ngScrollBottom: "="
//       },
//       link: function ($scope, $element) {
//         $scope.$watchCollection('ngScrollBottom', function (newValue) {
//           if (newValue) {
//             $timeout(function(){
//               $element.scrollTop($element[0].scrollHeight);
//             }, 0);
//           }
//         });
//       }
//     }
// }]);

e3xApp.directive('onErrorSrc', function() {
    return {
        link: function(scope, element, attrs) {
          element.bind('error', function() {
            if (attrs.src != attrs.onErrorSrc) {
              attrs.$set('src', attrs.onErrorSrc);
            }
          });
        }
    }
});

e3xApp.directive('scrollBottom', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        scope: {
            scrollBottom: "<"
        },
        link: function (scope, element) {
            scope.$watchCollection('scrollBottom', function (newValue) {
                if (newValue)
                {
                    $timeout(function(){
                        element[0].scrollTop = element[0].scrollHeight;
                    }, 100);
                }
            });
        }
    }
}]);