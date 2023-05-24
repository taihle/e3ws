const https_lib = require('https');

const WeatherInfo = require('./models/wi');
const wi_noaa = require('./wi_noaa');
const wi_owm = require('./wi_owm');
const wi_aw = require('./wi_aw');

// weather information service
var wi = {
    VALID_OBSERVATION_DELTA: 30,

    get: function (zipcode, onDone, onError, service) {
        wi.get_full_data(zipcode,
            function (data) {
                var datax = {};
                datax[zipcode] = { current: data };
                onDone(JSON.stringify(datax));
            }, 
            onError, 
            service
        );
    },

    get_full_data: function (zipcode, onDone, onError, service) {
        try {
            console.debug("wi.get_full_data(" + zipcode + "): " + (service ? " service = " + service : ""));
            if (zipcode == '00000') {
                onDone({temp_f:0, icon:'na', observation_time: Math.floor((new Date()).getTime() / 1000)});
                return;
            }
            if (zipcode == 'Pembroke, BM') zipcode = "Hamilton,BM";
            
            WeatherInfo.findOne({ zipcode: zipcode }).exec(function (err, data) {
                if (data && !err) {
                    if (wi.validate(data.data, zipcode, service)) {
                        onDone(JSON.parse(data.data));
                    }
                    else {
                        wi.update(zipcode, onDone, onError, 'update', service);
                    }
                }
                else {
                    wi.update(zipcode, onDone, onError, 'add', service);
                }
            });
        }
        catch (err) {
            console.error("wi.get_full_data(" + zipcode + "): exception - " + JSON.stringify(err));
            onError({error: 'exception - ' + JSON.stringify(err)});
        }
    },

    validate: function (data, zipcode, service) {
        console.debug("wi.validate(" + zipcode + "): " + data);
        try {
            var data = JSON.parse(data);
            var now = Date.now();
            var delta = wi_noaa.getObservationTimeDelta(now, data.observation_time, "cache");
            var ret = (delta <= wi.VALID_OBSERVATION_DELTA);
            if (service != undefined) {
                ret = ret && (data.api == service);
            }
            return ret;
        }
        catch(err) {
            console.error("wi.validate(" + zipcode + "): exception - " + JSON.stringify(err));
            return false;
        }
    },

    update: function (zipcode, onDone, onError, op, service) {
        try {
            wi.getLiveWeatherData(zipcode, function(data) {
                if (data) {
                    var observation_time = Math.floor((new Date()).getTime() / 1000);
                    console.debug('wi.update(): observation_time delta = ' + (observation_time - data.observation_time));
                    data.observation_time = observation_time;
                    if (op == 'add') {
                        WeatherInfo.create({ zipcode: zipcode, data: JSON.stringify(data) }, function (err, doc) {
                            if (doc && !err) {
                                console.debug('WeatherInfo.add(): ok');
                                onDone(data);
                            }
                            else {
                                console.warn('WeatherInfo.add(): failed - ' + JSON.stringify(err));
                                onDone(data);
                            }
                        });
                    }
                    else {
                        var update_data = { data: JSON.stringify(data), updated: new Date() };
                        WeatherInfo.findOneAndUpdate({ zipcode: zipcode }, { $set: update_data }, function (err, doc) {
                            if (doc && !err) {
                                console.debug('WeatherInfo.update(): ok');
                                onDone(data);
                            }
                            else {
                                console.warn('WeatherInfo.update(): failed - ' + JSON.stringify(err));
                                onDone(data);
                            }
                        });
                    }
                }
                else {
                    onError({error: 'weather data is not avaialble!'});
                }
            }, service);
        }
        catch(err) {
            console.error("wi.update(" + zipcode + "): exception - " + err);
            onError({error: 'exception - ' + JSON.stringify(err)});
        }
    },

    getLiveWeatherData: function(zipcode_or_city, onDone, service) {
        console.debug("wi.getLiveWeatherData(" + zipcode_or_city + "): " + (service ? " service = " + service : ""));
        if (service == 'aw') {
            wi_aw.getLiveWeatherDataAW(zipcode_or_city, onDone);
        }
        else if (service == 'noaa') {
            wi_noaa.getLiveWeatherDataGov(zipcode_or_city, onDone);
        }
        else if (service == 'owm') {
            wi_owm.getLiveWeatherDataOWM(zipcode_or_city, onDone);
        }
        else {
            wi_owm.getLiveWeatherDataOWM(zipcode_or_city, function(data){
                if (!data) {
                    wi_aw.getLiveWeatherDataAW(zipcode_or_city, function(data){
                        if (!data) {
                            wi_noaa.getLiveWeatherDataGov(zipcode_or_city, onDone);
                        }
                        else {
                            onDone(data);
                        }
                    });    
                }
                else {
                    onDone(data);
                }
            });    
        }
    }
};

module.exports = wi;