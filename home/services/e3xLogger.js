// ------------------------------------------------------------------------------
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
e3xApp.service('e3xLogger', ['$log', '$filter',
    function ($log, $filter) {
        var self = this;
        self.getTimeStamp = function () {
            return $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss.sss');
        };

        self.info = function (msg) {
            $log.info(msg);
        };

        self.debug = function (msg) {
            $log.debug(msg);
        };

        self.warn = function (msg) {
            $log.warn(msg);
        };

        self.error = function (msg) {
            $log.error(msg);
        };

        self.log = function (msg) {
            $log.log(msg);
        };
    }
]);