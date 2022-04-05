var mongoose = require('mongoose');

var WeatherInfoSchema = new mongoose.Schema({
  zipcode: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  updated: {
  	type: Date,
  	default: new Date()
  },  
  data: String
});

var WeatherInfo = mongoose.model('WeatherInfo', WeatherInfoSchema);

module.exports = WeatherInfo;
