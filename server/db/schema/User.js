var mongoose = require('mongoose');
var schema = module.exports = new mongoose.Schema({
  "id": String,
  "username": String,
  "description": String,
  "icon": String,
  "email": String,
  "phone": String
});
