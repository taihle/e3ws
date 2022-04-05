// ------------------------------------------------------------------------------
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.service('e3xUtil', [ function () {
    var self = this;
    self.isNullOrEmpty = function (txt) {
        return (txt === undefined || txt === null || txt === '' || txt.length <= 0);
    };

    self.setFocus = function(elementId) {
    	var e = document.getElementById(elementId);
    	if (e) {
    		e.focus();
    	}
    };
}]);