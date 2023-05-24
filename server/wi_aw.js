const https_lib = require('https');

// weather information service from OWM
var wi_aw = {
    AW_API_APP_ID: process.env.AW_API_APP_ID,

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
            icon_wi: data.WeatherIcon
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
        var url = "https://dataservice.accuweather.com/locations/v1/postalcodes/search?apikey=" + wi_aw.AW_API_APP_ID + "&q=" + zipcode_or_city;
        console.debug("wi_aw.getLocationKey('" + zipcode_or_city + "'): url = " + url);
        https_lib.get(url, function (resp) {
            let data = '';
            resp.on('data', function (chunk) { data += chunk; });
            resp.on('end', function () {
                console.debug("wi_aw.getLocationKey('" + zipcode_or_city + "'): ok - " + data);                    
                var ret = JSON.parse(data);
                if (ret) {                        
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
                var url = "https://dataservice.accuweather.com/currentconditions/v1/" + location_key + "?apikey=" + wi_aw.AW_API_APP_ID + "&details=true";
                https_lib.get(url, function (resp) {
                    let data = '';
                    resp.on('data', function (chunk) { data += chunk; });
                    resp.on('end', function () {
                        // console.log(data);
                        console.debug("wi_aw.getLiveWeatherDataAW('" + zipcode_or_city + "'): ok");                    
                        var ret = JSON.parse(data);
                        if (ret) {
                            onDone(wi_aw.convertFromAWData(ret[0]));
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