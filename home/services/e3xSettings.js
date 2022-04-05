// ------------------------------------------------------------------------------
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.service('e3xSettings', ['$http', '$location', 'localStorageService', 'e3xLogger', 'e3xUtil', 
    function ($http, $location, localStorageService, e3xLogger, e3xUtil) {

    e3xLogger.info("::e3xSettings::");

    var self = this;
        self._chatServer = $location.protocol() + "://" + $location.host();
        if ($location.port()) {
            self._chatServer += ":" + $location.port();
        }

    self._zipcode = "78758";

        try {
            $http.get('config/config.json', { headers: { 'Cache-Control': 'no-cache' } }).then(
                function (r) {
                    if (r.data.chat_server) {
                        self._chatServer = r.data.chat_server;
                    }
                    if (r.data.zipcode) {
                        self._zipcode = r.data.zipcode;
                    }
                },
                function (r) {
                }
            );
        }
        catch (err) {
        }
        
    self.getChatServerUrl = function() {
        var url = localStorageService.get('CHAT_SERVER_URL');
        if (e3xUtil.isNullOrEmpty(url)) {
            url = self._chatServer;
            // localStorageService.set('CHAT_SERVER_URL', url);
        }
        return url;
    };

    self.setChatServerUrl = function(url) {
        if (!e3xUtil.isNullOrEmpty(url)) {
            localStorageService.set('CHAT_SERVER_URL', url);
        }
    };

    self.getZipCode = function() {
        var zipcode = localStorageService.get('ZIPCODE');
        if (e3xUtil.isNullOrEmpty(zipcode)) {
            zipcode = self._zipcode;
            // localStorageService.set('ZIPCODE', zipcode);
        }
        return zipcode;
    };

    self.setZipCode = function(zipcode) {
        if (!e3xUtil.isNullOrEmpty(zipcode)) {
            localStorageService.set('ZIPCODE', zipcode);
        }
    };    
}]);
