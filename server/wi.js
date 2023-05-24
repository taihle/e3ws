const https_lib = require('https');
const zipcodes_lib = require('zipcodes');
const oauth_lib = require('oauth');

const WeatherInfo = require('./models/wi');

// weather information service
var wi = {
    VALID_OBSERVATION_DELTA: 30,
    OWM_API_APP_ID: process.env.OWM_API_APP_ID,

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
            var delta = wi.getObservationTimeDelta(now, data.observation_time);
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

    getObservationTimeDelta: function(now, observation_time) {
        var ot = new Date(observation_time * 1000);
        var delta = now - ot;
        var delta_in_minutes = Math.round(delta/1000/60);
        console.debug("wi.getObservationTimeDelta(): [now - observation_time] = [" + (now/1000) + '-' + observation_time + '] = [' + (new Date(now)) + " - " + ot + "] = " + delta + " mls = " + delta_in_minutes + " min");
        return delta_in_minutes;
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
        if (service == 'noaa') {
            wi.getLiveWeatherDataGov(zipcode_or_city, onDone);
        }
        else if (service == 'owm') {
            wi.getLiveWeatherDataOWM(zipcode_or_city, onDone);
        }
        else {
            wi.getLiveWeatherDataOWM(zipcode_or_city, function(data){
                if (!data) {
                    wi.getLiveWeatherDataGov(zipcode_or_city, onDone);
                }
                else {
                    onDone(data);
                }
            });    
        }

        //
        // Yahoo stops weather API service on 2021-05-01
        //
        // wi.getLiveWeatherDataYahoo(zipcode_or_city, function(data){
        //     if (!data) {
        //         wi.getLiveWeatherDataOWM(zipcode_or_city, function(data){
        //             if (!data) {
        //                 wi.getLiveWeatherDataGov(zipcode_or_city, onDone);
        //             }
        //             else {
        //                 onDone(data);
        //             }
        //         });
        //     }
        //     else {
        //         onDone(data);
        //     }
        // });
    },
   
    // Yahoo weather data as of 2019-03-15
    // {
    //     "location": {
    //         "woeid": 12797069,
    //         "city": "Salinas",
    //         "region": " CA",
    //         "country": "United States",
    //         "lat": 36.662418,
    //         "long": -121.649773,
    //         "timezone_id": "America/Los_Angeles"
    //     },
    //     "current_observation": {
    //         "wind": {
    //             "chill": 37,
    //             "direction": 110,
    //             "speed": 4.35
    //         },
    //         "atmosphere": {
    //             "humidity": 80,
    //             "visibility": 10.0,
    //             "pressure": 29.85,
    //             "rising": 0
    //         },
    //         "astronomy": {
    //             "sunrise": "7:18 am",
    //             "sunset": "7:14 pm"
    //         },
    //         "condition": {
    //             "text": "Mostly Clear",
    //             "code": 33,
    //             "temperature": 41
    //         },
    //         "pubDate": 1552658400
    //     },
    //     "forecasts": [
    //         {
    //             "day": "Fri",
    //             "date": 1552633200,
    //             "low": 41,
    //             "high": 69,
    //             "text": "Mostly Sunny",
    //             "code": 34
    //         },
    //         {
    //             "day": "Sat",
    //             "date": 1552719600,
    //             "low": 43,
    //             "high": 69,
    //             "text": "Sunny",
    //             "code": 32
    //         },
    //         {
    //             "day": "Sun",
    //             "date": 1552806000,
    //             "low": 45,
    //             "high": 75,
    //             "text": "Partly Cloudy",
    //             "code": 30
    //         },
    //         {
    //             "day": "Mon",
    //             "date": 1552892400,
    //             "low": 50,
    //             "high": 73,
    //             "text": "Sunny",
    //             "code": 32
    //         },
    //         {
    //             "day": "Tue",
    //             "date": 1552978800,
    //             "low": 48,
    //             "high": 67,
    //             "text": "Mostly Cloudy",
    //             "code": 28
    //         },
    //         {
    //             "day": "Wed",
    //             "date": 1553065200,
    //             "low": 52,
    //             "high": 63,
    //             "text": "Mostly Cloudy",
    //             "code": 28
    //         },
    //         {
    //             "day": "Thu",
    //             "date": 1553151600,
    //             "low": 49,
    //             "high": 63,
    //             "text": "Mostly Cloudy",
    //             "code": 28
    //         },
    //         {
    //             "day": "Fri",
    //             "date": 1553238000,
    //             "low": 50,
    //             "high": 63,
    //             "text": "Mostly Cloudy",
    //             "code": 28
    //         },
    //         {
    //             "day": "Sat",
    //             "date": 1553324400,
    //             "low": 49,
    //             "high": 61,
    //             "text": "Mostly Cloudy",
    //             "code": 28
    //         },
    //         {
    //             "day": "Sun",
    //             "date": 1553410800,
    //             "low": 47,
    //             "high": 62,
    //             "text": "Partly Cloudy",
    //             "code": 30
    //         }
    //     ]
    // }    
    YAHOO_CONDITION: ['tornado', 'tropical storm', 'hurricane', 'severe thunderstorms', 'thunderstorms', 'mixed rain and snow',
    'mixed rain and sleet', 'mixed snow and sleet', 'freezing drizzle', 'drizzle', 'freezing rain', 'showers',
    'showers', 'snow flurries', 'light snow showers', 'blowing snow', 'snow', 'hail', 'sleet', 'dust', 'foggy', 'haze', 'smoky',
    'blustery', 'windy', 'cold', 'cloudy', 'mostly cloudy (night)', 'mostly cloudy (day)', 'partly cloudy (night)',
    'partly cloudy (day)', 'clear (night)', 'sunny', 'fair (night)', 'fair (day)', 'mixed rain and hail', 'hot',
    'isolated thunderstorms', 'scattered thunderstorms (n)', 'scattered thunderstorms (d)', 'scattered showers',
    'heavy snow', 'scattered snow showers', 'heavy snow', 'partly cloudy', 'thundershowers', 'snow showers', 'isolated thundershowers'],

    YAHOO_TO_WU: ['tornado', 'tstorms', 'hurricane', 'tstorms', 'tstorms', 'sleat',
    'sleat', 'sleat', 'flurries', 'flurries', 'flurries', 'rain',
    'rain', 'flurries', 'flurries', 'snow', 'snow', 'sleat', 'sleat', 'dust', 'foggy', 'haze', 'smoky',
    'blustery', 'windy', 'cold', 'cloudy', 'cloudy', 'cloudy', 'cloudy',
    'cloudy', 'clear', 'sunny', 'fair', 'fair', 'rain', 'clear',
    'tstorms', 'tstorms', 'tstorms', 'chancerain',
    'snow', 'snow', 'snow', 'cloudy', 'tstorms', 'snow', 'tstorms'],

    yahooToWiWuIcon: function(icon_code) {
        var ret = wi.YAHOO_TO_WU[icon_code];
        if (!ret) ret = 'unknown';
        return ret;
    },
    
    yahooToWiIcon: function(icon_code) {
        return 'wi-yahoo-' + icon_code;
    },

    convertFromYahooData: function(data) {
        try {
            if (data) {
                return { 
                    api: "yahoo",
                    observation_time: data.pubDate, 
                    temp_f: data.condition.temperature,
                    temp_c: Math.round(((data.condition.temperature - 32) * 5 / 9)),
                    condition: data.condition.text,
                    wind_mph: data.wind.speed,
                    wind_dir: data.wind.direction,
                    icon: wi.yahooToWiWuIcon(data.condition.code), // WU or WI
                    icon_code: data.condition.code,
                    icon_wi: wi.yahooToWiIcon(data.condition.code),
                    sunrise: data.astronomy.sunrise,
                    sunset: data.astronomy.sunset
                };
            }
            else {
                return null;
            }    
        }
        catch(err) {
            console.error("wi.convertFromYahooData(): exception - " + JSON.stringify(err));
            return null;
        }
    },
    
    yahooOAuthRequest: null,
    getLiveWeatherDataYahoo: function(zipcode_or_city, onDone) {
        console.debug("wi.getLiveWeatherDataYahoo(" + zipcode_or_city + "):");
        try {
            if (!wi.yahooOAuthRequest) {
                wi.yahooOAuthRequest = new oauth_lib.OAuth(null, null,
                    process.env.YAHOO_API_KEY, // 'your-consumer-key',
                    process.env.YAHOO_API_SECRETE, // 'your-consumer-secret',
                    '1.0', null, 'HMAC-SHA1', null, { "X-Yahoo-App-Id": process.env.YAHOO_API_APP_ID }
                );    
            }
    
            if (wi.yahooOAuthRequest) {
                wi.yahooOAuthRequest.get(
                    'https://weather-ydn-yql.media.yahoo.com/forecastrss?location=' + zipcode_or_city + '&format=json',
                    null,
                    null,
                    function (err, data, result) {
                        // console.log("wi.getLiveWeatherDataYahoo(" + zipcode_or_city + "): result = " + result);
                        if (err) {
                            console.warn("wi.getLiveWeatherDataYahoo(" + zipcode_or_city + "): error - " + err);
                            onDone(null);
                        } else {
                            console.debug("wi.getLiveWeatherDataYahoo(" + zipcode_or_city + "): ok - " + data);
                            data = JSON.parse(data);
                            onDone(wi.convertFromYahooData(data.current_observation));
                        }
                    }
                );    
            }
            else {
                console.warn("wi.getLiveWeatherDataYahoo(" + zipcode_or_city + "): error - failed to create OAuth request!");
                onDone(null);
            }
        }
        catch(err) {
            console.error("wi.getLiveWeatherDataYahoo(" + zipcode_or_city + "): exception - " + JSON.stringify(err));
            onDone(null);
        }
    },

    // OWM weather data as of 2019-03-15
    // {
    //     "coord": {
    //         "lon": -64.78,
    //         "lat": 32.3
    //     },
    //     "weather": [
    //         {
    //             "id": 802,
    //             "main": "Clouds",
    //             "description": "scattered clouds",
    //             "icon": "03d"
    //         }
    //     ],
    //     "base": "stations",
    //     "main": {
    //         "temp": 66.06,
    //         "pressure": 1025,
    //         "humidity": 59,
    //         "temp_min": 64.99,
    //         "temp_max": 66.99
    //     },
    //     "visibility": 10000,
    //     "wind": {
    //         "speed": 4.7
    //     },
    //     "clouds": {
    //         "all": 40
    //     },
    //     "dt": 1552671056,
    //     "sys": {
    //         "type": 1,
    //         "id": 8816,
    //         "message": 0.0045,
    //         "country": "BM",
    //         "sunrise": 1552645722,
    //         "sunset": 1552688847
    //     },
    //     "id": 3573197,
    //     "name": "Hamilton",
    //     "cod": 200
    // }

    // openweathermap to wi icons set mapping 
    OWM_TO_WU: {       
        '01d': 'sunny', // 'clear sky' // 800	clear sky	 01d  01n
        '01n': 'clear',
        '02d': 'cloudy', // 801	few clouds	 02d  02n
        '02n': 'alt-cloudy',
        '03d': 'cloudy', // 802	scattered clouds	 03d  03n
        '03n': 'partly-cloudy',
        '04d': 'cloudy', // 803	broken clouds	 04d  04n
        '04n': 'partly-cloudy',
        '05d': 'cloudy-high', // 804	overcast clouds	 04d  04n
        '05n': 'cloudy-high'
    },

    owmToWiWuIcon: function(icon_id) {
        var ret = wi.OWM_TO_WU[icon_id];
        if (!ret) ret = 'unknown';
        return ret;
    },

    OWM_TO_YAHOO: {       
        '200':3, '201':3, '202':3, '210':4, '211':4, '212':4, '221':4, 
        '230':3, '231':3, '232':3, '300':9, '301':9, '302':11, '310':9, '311':11, '312':11, '313':11, '314':11, '321':9, 
        '500':9, '501':10, '502':10, '503':10, '504':10, '511':18, '520':18, '521':18, '522':18, '531':37, 
        '600':16, '601':16, '602':16, '611':18, '612':18, '615':18, '616':18, '620':18, '621':16, '622':16, 
        '701':35, '711':22, '721':34, '731':19, '741':20, '761':19, '762':19, '771':24, '781':0,
        '800':32, '801':24, '802':24, '803':24, '804':29, 
        '900':0, '901':45, '902':2, '903':25, '904':36, '905':21, '906':17, '957':23
    },

    owmToWiYahooIcon: function(icon_id) {
        var ret = wi.OWM_TO_YAHOO[icon_id];
        if (!ret) ret = 3200;
        return ret;
    },

    owmToWiIcon: function(icon_id, icon_name) {
        var ret = "";
        if (icon_name) {
            // can use sunrise/sunset to do this calculation
            if (icon_name.indexOf('d') >= 0) ret = "day-";
            if (icon_name.indexOf('n') >= 0) ret = "night-";
        }
        ret += icon_id;
        return "wi-owm-" + ret;
    },

    convertFromOWMData: function(data) {
        return { 
            api: "owm",
            observation_time: data.dt, 
            temp_f: data.main.temp,
            temp_c: Math.round(((data.main.temp - 32) * 5 / 9)),
            condition: data.weather[0].description,
            wind_mph: data.wind.speed,
            wind_dir: data.wind.deg,
            icon: wi.owmToWiWuIcon(data.weather[0].icon, data.weather[0].description), // backward comp with WU icon
            icon_code: wi.owmToWiYahooIcon(data.weather[0].id), // backward comp with Yahoo icon
            icon_wi: wi.owmToWiIcon(data.weather[0].id, data.weather[0].icon), // full WI icon name
            sunrise: data.sys.sunrise,
            sunset: data.sys.sunset
        }
    },

    getLiveWeatherDataOWM: function(zipcode_or_city, onDone) {
        console.debug("wi.getLiveWeatherDataOWM(" + zipcode_or_city + "):");
        try {
            // check to see if it's zipcode or city name
            var q = "q=";
            var reg = /^\d+$/;
            if (reg.test(zipcode_or_city)) q = "zip=";

            var url = "https://api.openweathermap.org/data/2.5/weather?APPID=" + wi.OWM_API_APP_ID + "&units=imperial&" + q + zipcode_or_city;
            console.debug("wi.getLiveWeatherDataOWM('" + zipcode_or_city + "'): url = " + url);
            https_lib.get(url, function (resp) {
                let data = '';
                resp.on('data', function (chunk) { data += chunk; });
                resp.on('end', function () {
                    // console.log(data);    
                    console.debug("wi.getLiveWeatherData('" + zipcode_or_city + "'): ok - " + data);                    
                    var ret = JSON.parse(data);
                    if (ret.cod == 200) {                        
                        onDone(wi.convertFromOWMData(ret));
                    }
                    else if (ret.cod == 429) { // account limit reached
                        console.warn("wi.getLiveWeatherDataOWM('" + zipcode_or_city + "'): error - account limit reached return code = " + ret.cod);
                        onDone(null);
                    }
                    else {
                        console.warn("wi.getLiveWeatherDataOWM('" + zipcode_or_city + "'): error - " + data);
                        onDone(null);
                   }                
                });
            }).on("error", function (err) {
                console.warn("wi.getLiveWeatherDataOWM('" + zipcode_or_city + "'): error - " + JSON.stringify(err));
                onDone(null);
            });
        }
        catch (err) {
            console.error("wi.getLiveWeatherDataOWM(): exception - " + JSON.stringify(err));
            onDone(null);
        }
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
        console.debug("wi.convertFromGovData(" + station.stationIdentifier + "):"); // data = " + JSON.stringify(data, null, 2));
        var ret = null;
        try  {
            if (data && data.features) {
                // just get the first observation data
                var p = data.features[0].properties;
                if (p.temperature.value !== null) {
                    console.debug("wi.convertFromGovData(): timestamp = " + p.timestamp + " => " + new Date(Date.parse(p.timestamp)));
                    ret = { 
                        api: "noaa",
                        station: station.stationIdentifier,
                        condition: p.textDescription,
                        observation_time: Math.round(Date.parse(p.timestamp) / 1000),
                        temp_c: Math.round(p.temperature.value * 100) / 100,
                        temp_f: Math.round(((p.temperature.value * 9/5) + 32) * 100) / 100,
                        icon: p.textDescription.toLowerCase(),
                        icon_code: wi.getYahooIconCodeFromGovData(p),
                        icon_wi: wi.getWiIconFromGovData(p),
                        icon_url: p.icon
                    };
                }
                else {
                    console.warn("wi.convertFromGovData(): invalid temperature @ " + station.stationIdentifier);
                }
            }
        }
        catch(err) {
            console.error("wi.convertFromGovData(): exception - " + JSON.stringify(err));
        }
        return ret;
    },

    fetchWeatherRequest: function(path, onDone) {
        console.debug("fetchWeatherRequest(): path = " + path);
        try {
            wi.weather_req_options.path = path;
            https_lib.get(wi.weather_req_options, function (resp) {
                let data = '';
                resp.on('data', function (chunk) { data += chunk; });
                resp.on('end', function () {
                    // console.log(data);
                    console.debug("wi.fetchWeatherRequest('" + path + "'): ok");
                    onDone(JSON.parse(data));
                });
            }).on("error", function (err) {
                console.warn("wi.fetchWeatherRequest('" + path + "'): error - " + JSON.stringify(err));
                onDone(ret);
            });
        }
        catch(err) {
            console.error("wi.fetchWeatherRequest('" + path + "'): exception - " + JSON.stringify(err));
            onDone(null);
        }
    },

    getObservationStations: function(p, onDone) {
        var ret = [];
        try {
            var path = '/gridpoints/' + p.cwa + '/' + p.gridX + ',' + p.gridY + '/stations';
            wi.fetchWeatherRequest(path, function(data){
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
            console.error("wi.getObservationStations(): exception - " + JSON.stringify(err));
            onDone(ret);
        }
    },

    getCurrentObservationData: function(station, onDone) {
        console.debug("getCurrentObservationData(" + station.stationIdentifier + "):");
        try {
            var path = '/stations/' + station.stationIdentifier + '/observations';
            wi.fetchWeatherRequest(path, function(data) {
                onDone(wi.convertFromGovData(station, data));
            });
        }
        catch(err) {
            console.error("wi.getCurrentObservationData(): exception - " + JSON.stringify(err));
            onDone(null);
        }
    },
  
    getCurrentObservationDataFromList: function(i, lst, now, ret, onDone) {
        console.debug("getCurrentObservationDataFromList(" + i + "):");
        if (i < lst.length) {
            wi.getCurrentObservationData(lst[i], function(data){
                if (data) {
                    var delta = wi.getObservationTimeDelta(now, data.observation_time);
                    if (ret.delta === -1 || !ret.data || ret.delta > delta) {
                        ret.data = data;
                        ret.delta = delta;
                    }
                    if (delta <= wi.VALID_OBSERVATION_DELTA)  // get the first valid one
                    {
                        onDone(ret.data);
                    }
                    else {
                        wi.getCurrentObservationDataFromList(i+1, lst, now, ret, onDone);
                    }
                }
                else {
                    wi.getCurrentObservationDataFromList(i+1, lst, now, ret, onDone);
                }
            });
        }
        else {            
            var delta = wi.getObservationTimeDelta(now, ret.data.observation_time);
            if (delta > wi.VALID_OBSERVATION_DELTA) {                
                ret.data.observation_time = Math.floor(now / 1000); // assume the best
                console.debug("wi.getCurrentObservationDataFromList(): done - reset observation_time to " + ret.data.observation_time);
            }
            onDone(ret.data);
        }
    },

    getLiveWeatherDataGov: function(zipcode_or_city, onDone) {
        console.debug("wi.getLiveWeatherDataGov(" + zipcode_or_city + "):");
        try {
            var zipcode_data = zipcodes_lib.lookup(zipcode_or_city);
            if (zipcode_data && zipcode_data.latitude && zipcode_data.longitude) {
                zipcode_or_city = zipcode_data.latitude + "," + zipcode_data.longitude;
            }
            var path = '/points/' + zipcode_or_city;
            wi.fetchWeatherRequest(path, function(data){
                if (data && data.properties) {
                    wi.getObservationStations(data.properties, function(stations){
                        if (stations && stations.length > 0) {
                            var now = Date.now();
                            var ret = { delta: -1 };
                            wi.getCurrentObservationDataFromList(0, stations, now, ret, onDone);
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
            console.error("wi.getLiveWeatherDataGov(): exception - " + JSON.stringify(err));
            onDone(null);
        }
    }
};

module.exports = wi;