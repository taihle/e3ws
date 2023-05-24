const https_lib = require('https');

// weather information service from OWM
var wi_owm = {
    OWM_API_APP_ID: process.env.OWM_API_APP_ID,
 
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
        var ret = wi_owm.OWM_TO_WU[icon_id];
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
        var ret = wi_owm.OWM_TO_YAHOO[icon_id];
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
            icon: wi_owm.owmToWiWuIcon(data.weather[0].icon, data.weather[0].description), // backward comp with WU icon
            icon_code: wi_owm.owmToWiYahooIcon(data.weather[0].id), // backward comp with Yahoo icon
            icon_wi: wi_owm.owmToWiIcon(data.weather[0].id, data.weather[0].icon), // full WI icon name
            sunrise: data.sys.sunrise,
            sunset: data.sys.sunset
        }
    },

    getLiveWeatherDataOWM: function(zipcode_or_city, onDone) {
        console.debug("wi_owm.getLiveWeatherDataOWM(" + zipcode_or_city + "):");
        try {
            // check to see if it's zipcode or city name
            var q = "q=";
            var reg = /^\d+$/;
            if (reg.test(zipcode_or_city)) q = "zip=";

            var url = "https://api.openweathermap.org/data/2.5/weather?APPID=" + wi_owm.OWM_API_APP_ID + "&units=imperial&" + q + zipcode_or_city;
            console.debug("wi_owm.getLiveWeatherDataOWM('" + zipcode_or_city + "'): url = " + url);
            https_lib.get(url, function (resp) {
                let data = '';
                resp.on('data', function (chunk) { data += chunk; });
                resp.on('end', function () {
                    // console.log(data);    
                    console.debug("wi_owm.getLiveWeatherData('" + zipcode_or_city + "'): ok - " + data);                    
                    var ret = JSON.parse(data);
                    if (ret.cod == 200) {                        
                        onDone(wi_owm.convertFromOWMData(ret));
                    }
                    else if (ret.cod == 429) { // account limit reached
                        console.warn("wi_owm.getLiveWeatherDataOWM('" + zipcode_or_city + "'): error - account limit reached return code = " + ret.cod);
                        onDone(null);
                    }
                    else {
                        console.warn("wi_owm.getLiveWeatherDataOWM('" + zipcode_or_city + "'): error - " + data);
                        onDone(null);
                   }                
                });
            }).on("error", function (err) {
                console.warn("wi_owm.getLiveWeatherDataOWM('" + zipcode_or_city + "'): error - " + JSON.stringify(err));
                onDone(null);
            });
        }
        catch (err) {
            console.error("wi_owm.getLiveWeatherDataOWM(): exception - " + JSON.stringify(err));
            onDone(null);
        }
    }
};

module.exports = wi_owm;