var mongoose = require('mongoose');
var schema = module.exports = new mongoose.Schema({
  "id": String,
  "name": String,
  "description": String,
  "image": [{
    "uri": String,
    "sperical": Boolean
  }],
  "thumbnail": String,
  "lat": [Number],
  "ownerId": String,
  "using": Boolean,
  "price": Number,
  // "reviewOverview": {
  // "rateAverage": Number,
  // "rateCount": 10,
  // "reviewCount": 10
  // },
  "review": [{
    "comment": String,
    "rate": Number,
    "userid": String
  }]
});
