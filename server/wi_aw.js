const https_lib = require('https');

// weather information service from OWM
var wi_aw = {
    SERVER_URL: "https://dataservice.accuweather.com/",
    AW_API_APP_ID: process.env.AW_API_APP_ID,

    // see equivalent AW icons here:
    // https://developer.accuweather.com/weather-icons
    // https://www.accuweather.com/images/weathericons/{i}.svg
    AW_TO_WI: [
      'wi-alien',               // 0 - unknown
      'wi-day-sunny',           //	1 Sunny	Yes	No	Sunny
      'wi-wu-mostlysunny',      // 2 Mostly Sunny	Yes	No	Mostly Sunny
      'wi-yahoo-28',            // 3 Partly Sunny	Yes	No	Partly Sunny
      'wi-day-sunny-overcast',  // 4	Intermittent Clouds	Yes	No	Intermittent Clouds
      'wi-day-haze',            // 5	Hazy Sunshine	Yes	No	Hazy Sunshine
      'wi-day-cloudy',          // 6	Mostly Cloudy	Yes	No	Mostly Cloudy
      'wi-cloud',               // 7	Cloudy	Yes	Yes	Cloudy
      'wi-cloudy',              // 8	Dreary	Yes	Yes	Dreary (Overcast)
      'wi-na',
      'wi-na',
      'wi-fog',                 // 11	Fog	Yes	Yes	Fog
      'wi-showers',             // 12	Showers	Yes	Yes	Showers
      'wi-day-showers',         // 13	Mostly Cloudy w/ Showers	Yes	No	Mostly Cloudy w/ Showers
      'wi-day-rain',            // 14	Partly Sunny w/ Showers	Yes	No	Partly Sunny w/ Showers
      'wi-thunderstorm',        // 15	T-Storms	Yes	Yes	T-Storms
      'wi-day-storm-showers',   // 16	Mostly Cloudy w/ T-Storms	Yes	No	Mostly Cloudy w/ T-Storms
      'wi-day-thunderstorm',    // 17	Partly Sunny w/ T-Storms	Yes	No	Partly Sunny w/ T-Storms
      'wi-rain',                 // 18	Rain	Yes	Yes	Rain
      'wi-wu-flurries',          // 19	Flurries	Yes	Yes	Flurries
      'wi-night-alt-snow-wind',  // 20	Mostly Cloudy w/ Flurries	Yes	No	Mostly Cloudy w/ Flurries
      'wi-night-snow',           // 21	Partly Sunny w/ Flurries	Yes	No	Partly Sunny w/ Flurries
      'wi-day-snow',             // 22	Snow	Yes	Yes	Snow
      'wi-night-snow',           // 23	Mostly Cloudy w/ Snow	Yes	No	Mostly Cloudy w/ Snow
      'wi-yahoo-25',             // 24	Ice	Yes	Yes	Ice
      'wi-day-sleet',            // 25	Sleet	Yes	Yes	Sleet
      'wi-day-sleet-storm',      // 26	Freezing Rain	Yes	Yes	Freezing Rain
      'wi-na',
      'wi-na',
      'wi-night-rain-mix',      // 29	Rain and Snow	Yes	Yes	Rain and Snow
      'wi-hot',                 // 30	Hot	Yes	Yes	Hot
      'wi-thermometer-exterior',// 31	Cold	Yes	Yes	Cold
      'wi-strong-wind',         // 32	Windy	Yes	Yes	Windy
      'wi-night-clear',         // 33	Clear	No	Yes	Clear
      'wi-night-alt-cloudy',        // 34	Mostly Clear	No	Yes	Mostly Clear
      'wi-night-cloudy',            // 35	Partly Cloudy	No	Yes	Partly Cloudy
      'wi-night-alt-cloudy-windy',  // 36	Intermittent Clouds	No	Yes	Intermittent Clouds
      'wi-night-alt-hail',          // 37	Hazy Moonlight	No	Yes	Hazy Moonlight
      'wi-night-fog',               // 38	Mostly Cloudy	No	Yes	Mostly Cloudy
      'wi-night-alt-showers',       // 39	Partly Cloudy w/ Showers	No	Yes	Partly Cloudy w/ Showers
      'wi-night-alt-rain-wind',     // 40	Mostly Cloudy w/ Showers	No	Yes	Mostly Cloudy w/ Showers
      'wi-night-alt-thunderstorm',  // 41	Partly Cloudy w/ T-Storms	No	Yes	Partly Cloudy w/ T-Storms
      '	wi-night-alt-storm-showers',   // 42	Mostly Cloudy w/ T-Storms	No	Yes	Mostly Cloudy w/ T-Storms
      'wi-night-alt-sleet-storm',      // 43	Mostly Cloudy w/ Flurries	No	Yes	Mostly Cloudy w/ Flurries
      'wi-night-alt-snow',             // 44	Mostly Cloudy w/ Snow	No	Yes	Mostly Cloudy w/ Snow
      ],
  
      // TODO: icon mapping
      convertFromAWData: function(data) {
          return { 
              api: "aw",
              observation_time: data.LocalObservationDateTime, 
              temp_f: data.Temperature.Imperial.Value,
              temp_c: data.Temperature.Metric.Value,
              condition: data.WeatherText,
              wind_mph: data.Wind.Speed.Imperial.Value,
              wind_dir: data.Wind.Direction.Localized,
              icon: data.WeatherIcon,
              icon_code: data.WeatherIcon,
              icon_wi: wi_aw.AW_TO_WI[data.WeatherIcon],
              icon_url: "https://www.accuweather.com/images/weathericons/" + data.WeatherIcon + ".svg"
          }
      },

    /*
    [
  {
    "Version": 1,
    "Key": "34438_PC",
    "Type": "PostalCode",
    "Rank": 45,
    "LocalizedName": "Round Rock",
    "EnglishName": "Round Rock",
    "PrimaryPostalCode": "78681",
    "Region": {
      "ID": "NAM",
      "LocalizedName": "North America",
      "EnglishName": "North America"
    },
    "Country": {
      "ID": "US",
      "LocalizedName": "United States",
      "EnglishName": "United States"
    },
    "AdministrativeArea": {
      "ID": "TX",
      "LocalizedName": "Texas",
      "EnglishName": "Texas",
      "Level": 1,
      "LocalizedType": "State",
      "EnglishType": "State",
      "CountryID": "US"
    },
    "TimeZone": {
      "Code": "CDT",
      "Name": "America/Chicago",
      "GmtOffset": -5,
      "IsDaylightSaving": true,
      "NextOffsetChange": "2023-11-05T07:00:00Z"
    },
    "GeoPosition": {
      "Latitude": 30.517,
      "Longitude": -97.69,
      "Elevation": {
        "Metric": {
          "Value": 226,
          "Unit": "m",
          "UnitType": 5
        },
        "Imperial": {
          "Value": 741,
          "Unit": "ft",
          "UnitType": 0
        }
      }
    },
    "IsAlias": false,
    "ParentCity": {
      "Key": "2144323",
      "LocalizedName": "Round Rock",
      "EnglishName": "Round Rock"
    },
    "SupplementalAdminAreas": [
      {
        "Level": 2,
        "LocalizedName": "Williamson",
        "EnglishName": "Williamson"
      }
    ],
    "DataSets": [
      "AirQualityCurrentConditions",
      "AirQualityForecasts",
      "Alerts",
      "DailyAirQualityForecast",
      "DailyPollenForecast",
      "ForecastConfidence",
      "FutureRadar",
      "MinuteCast",
      "Radar"
    ]
  },
    */
    getLocationKey: function(zipcode_or_city, onDone) {
        var url = wi_aw.SERVER_URL + "locations/v1/postalcodes/search?apikey=" + wi_aw.AW_API_APP_ID + "&q=" + zipcode_or_city;
        if (isNaN(zipcode_or_city)) {
            url = wi_aw.SERVER_URL + "locations/v1/cities/search?apikey=" + wi_aw.AW_API_APP_ID + "&q=" + zipcode_or_city;
        }        
        
        console.debug("wi_aw.getLocationKey('" + zipcode_or_city + "'): url = " + url);
        
        https_lib.get(url, function (resp) {
            let data = '';
            resp.on('data', function (chunk) { data += chunk; });
            resp.on('end', function () {
                console.debug("wi_aw.getLocationKey('" + zipcode_or_city + "'): ok - " + data);                    
                var ret = JSON.parse(data);
                if (ret && Array.isArray(ret)) {
                    onDone(ret[0].Key);
                }
            });
        }).on("error", function (err) {
            console.warn("wi_aw.getLocationKey('" + zipcode_or_city + "'): error - " + JSON.stringify(err));
            onDone(null);
        });
    },

    
    /*
[
  {
    "LocalObservationDateTime": "2023-05-24T16:23:00-05:00",
    "EpochTime": 1684963380,
    "WeatherText": "Mostly sunny",
    "WeatherIcon": 2,
    "HasPrecipitation": false,
    "PrecipitationType": null,
    "IsDayTime": true,
    "Temperature": {
      "Metric": {
        "Value": 28,
        "Unit": "C",
        "UnitType": 17
      },
      "Imperial": {
        "Value": 82,
        "Unit": "F",
        "UnitType": 18
      }
    },
    "MobileLink": "http://www.accuweather.com/en/us/round-rock-tx/78664/current-weather/34438_pc?lang=en-us",
    "Link": "http://www.accuweather.com/en/us/round-rock-tx/78664/current-weather/34438_pc?lang=en-us"
  }
]    
    */
    getLiveWeatherDataAW: function(zipcode_or_city, onDone) {
        console.debug("wi_aw.getLiveWeatherDataAW(" + zipcode_or_city + "):");
        try {
            wi_aw.getLocationKey(zipcode_or_city, function(location_key){
                var url = wi_aw.SERVER_URL + "currentconditions/v1/" + location_key + "?apikey=" + wi_aw.AW_API_APP_ID + "&details=true";
                https_lib.get(url, function (resp) {
                    let data = '';
                    resp.on('data', function (chunk) { data += chunk; });
                    resp.on('end', function () {
                        // console.log(data);
                        console.debug("wi_aw.getLiveWeatherDataAW('" + zipcode_or_city + "'): ok");                    
                        var ret = JSON.parse(data);
                        if (ret && Array.isArray(ret)) {
                            onDone(wi_aw.convertFromAWData(ret[0]));
                        }
                        else {
                            onDone(null);
                        }
                    });
                }).on("error", function (err) {
                    console.warn("wi_aw.getLiveWeatherDataAW('" + zipcode_or_city + "'): error - " + JSON.stringify(err));
                    onDone(null);
                });
            });
        }
        catch (err) {
            console.error("wi_aw.getLiveWeatherDataAW(): exception - " + JSON.stringify(err));
            onDone(null);
        }
    }
};

module.exports = wi_aw;