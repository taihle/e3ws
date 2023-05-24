const https_lib = require('https');
const zipcodes_lib = require('zipcodes');

// weather information service from NOAA (api.weather.gov)
var wi_noaa = {
    VALID_OBSERVATION_DELTA: 30,

    getObservationTimeDelta: function(now, observation_time, station) {
        var ot = new Date(observation_time * 1000);
        var delta = now - ot;
        var delta_in_minutes = Math.round(delta/1000/60);
        console.debug("wi_noaa.getObservationTimeDelta(" + station + "): [now - observation_time] = [" + (now/1000) + '-' + observation_time + '] = [' + (new Date(now)) + " - " + ot + "] = " + delta + " mls = " + delta_in_minutes + " min");
        return delta_in_minutes;
    },

    // api.weather.gov only take in (LAT,LNG)
    weather_req_options: {
        hostname: 'api.weather.gov',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        path: '/'
    },

    getWiIconFromGovData: function() {
        return '';
    },

    getYahooIconCodeFromGovData: function(p) {
        return 3200;
    },

    convertFromGovData: function(station, data) {
        console.debug("wi_noaa.convertFromGovData(" + station.stationIdentifier + "):"); // data = " + JSON.stringify(data, null, 2));
        var ret = null;
        try  {
            if (data && data.features) {
                // just get the first observation data
                var p = data.features[0].properties;
                if (p.temperature.value !== null) {
                    console.debug("wi_noaa.convertFromGovData(): timestamp = " + p.timestamp + " => " + new Date(Date.parse(p.timestamp)));
                    ret = { 
                        api: "noaa",
                        station: station.stationIdentifier,
                        condition: p.textDescription,
                        observation_time: Math.round(Date.parse(p.timestamp) / 1000),
                        temp_c: Math.round(p.temperature.value * 100) / 100,
                        temp_f: Math.round(((p.temperature.value * 9/5) + 32) * 100) / 100,
                        icon: p.textDescription.toLowerCase(),
                        icon_code: wi_noaa.getYahooIconCodeFromGovData(p),
                        icon_wi: wi_noaa.getWiIconFromGovData(p),
                        icon_url: p.icon
                    };
                }
                else {
                    console.warn("wi_noaa.convertFromGovData(): invalid temperature @ " + station.stationIdentifier);
                }
            }
        }
        catch(err) {
            console.error("wi_noaa.convertFromGovData(): exception - " + JSON.stringify(err));
        }
        return ret;
    },

    fetchWeatherRequest: function(path, onDone) {
        console.debug("fetchWeatherRequest(): path = " + path);
        try {
            wi_noaa.weather_req_options.path = path;
            https_lib.get(wi_noaa.weather_req_options, function (resp) {
                let data = '';
                resp.on('data', function (chunk) { data += chunk; });
                resp.on('end', function () {
                    // console.log(data);
                    console.debug("wi_noaa.fetchWeatherRequest('" + path + "'): ok");
                    onDone(JSON.parse(data));
                });
            }).on("error", function (err) {
                console.warn("wi_noaa.fetchWeatherRequest('" + path + "'): error - " + JSON.stringify(err));
                onDone(ret);
            });
        }
        catch(err) {
            console.error("wi_noaa.fetchWeatherRequest('" + path + "'): exception - " + JSON.stringify(err));
            onDone(null);
        }
    },

    getObservationStations: function(p, onDone) {
        var ret = [];
        try {
            var path = '/gridpoints/' + p.cwa + '/' + p.gridX + ',' + p.gridY + '/stations';
            wi_noaa.fetchWeatherRequest(path, function(data){
                if (data && Array.isArray(data.features)) {
                    for(var i=0; i<data.features.length; i++) {
                        var s = data.features[i];
                        if (s.properties && s.properties['@type'] == 'wx:ObservationStation') {
                            ret.push(s.properties);
                        }
                    }
                }
                onDone(ret);
            });    
        }
        catch(err) {
            console.error("wi_noaa.getObservationStations(): exception - " + JSON.stringify(err));
            onDone(ret);
        }
    },

    getCurrentObservationData: function(station, onDone) {
        console.debug("getCurrentObservationData(" + station.stationIdentifier + "):");
        try {
            var path = '/stations/' + station.stationIdentifier + '/observations';
            wi_noaa.fetchWeatherRequest(path, function(data) {
                onDone(wi_noaa.convertFromGovData(station, data));
            });
        }
        catch(err) {
            console.error("wi_noaa.getCurrentObservationData(): exception - " + JSON.stringify(err));
            onDone(null);
        }
    },
  
    getCurrentObservationDataFromList: function(i, lst, now, ret, onDone) {
        console.debug("getCurrentObservationDataFromList(" + i + "):");
        if (i < lst.length) {
            wi_noaa.getCurrentObservationData(lst[i], function(data){
                if (data) {
                    var delta = wi_noaa.getObservationTimeDelta(now, data.observation_time, data.station);
                    if (ret.delta === -1 || !ret.data || ret.delta > delta) {
                        ret.data = data;
                        ret.delta = delta;
                    }
                    if (delta <= wi_noaa.VALID_OBSERVATION_DELTA)  // get the first valid one
                    {
                        onDone(ret.data);
                    }
                    else {
                        wi_noaa.getCurrentObservationDataFromList(i+1, lst, now, ret, onDone);
                    }
                }
                else {
                    wi_noaa.getCurrentObservationDataFromList(i+1, lst, now, ret, onDone);
                }
            });
        }
        else {            
            var delta = wi_noaa.getObservationTimeDelta(now, ret.data.observation_time, data.station);
            if (delta > wi_noaa.VALID_OBSERVATION_DELTA) {                
                ret.data.observation_time = Math.floor(now / 1000); // assume the best
                console.debug("wi_noaa.getCurrentObservationDataFromList(): done - reset observation_time to " + ret.data.observation_time);
            }
            onDone(ret.data);
        }
    },

    getLiveWeatherDataGov: function(zipcode_or_city, onDone) {
        console.debug("wi_noaa.getLiveWeatherDataGov(" + zipcode_or_city + "):");
        try {
            var zipcode_data = zipcodes_lib.lookup(zipcode_or_city);
            if (zipcode_data && zipcode_data.latitude && zipcode_data.longitude) {
                zipcode_or_city = zipcode_data.latitude + "," + zipcode_data.longitude;
            }
            var path = '/points/' + zipcode_or_city;
            wi_noaa.fetchWeatherRequest(path, function(data){
                if (data && data.properties) {
                    wi_noaa.getObservationStations(data.properties, function(stations){
                        if (stations && stations.length > 0) {
                            var now = Date.now();
                            var ret = { delta: -1 };
                            wi_noaa.getCurrentObservationDataFromList(0, stations, now, ret, onDone);
                        }
                        else {
                            onDone(null);
                        }
                    });
                }
                else {
                    onDone(null);
                }
            });
        }
        catch (err) {
            console.error("wi_noaa.getLiveWeatherDataGov(): exception - " + JSON.stringify(err));
            onDone(null);
        }
    }
};

module.exports = wi_noaa;