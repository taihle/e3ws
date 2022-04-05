// common util
var util = {
    getDateStamp: function () {
        var now = new Date();
        var ds = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);
        return ds;
    },
    getTimeStamp: function () {
        var now = new Date();
        var ts = now.getHours() + ":" + ("0" + (now.getMinutes() + 1)).slice(-2) + ":" + ("0" + now.getSeconds()).slice(-2);
        return ts;
    },
    getDateTimeStamp: function () {
        var now = new Date();
        var dts = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2) + 
            " " + now.getHours() + ":" + ("0" + (now.getMinutes() + 1)).slice(-2) + ":" + ("0" + now.getSeconds()).slice(-2);
        return dts;
    }
};

module.exports = util;