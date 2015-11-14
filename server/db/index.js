var mongoose = require('mongoose'),
  fs = require('fs');
mongoose.connect('mongodb://localhost:27017/airwnc');

var db = module.exports = {};

// assign all ./schema/*.js files to this.MODEL_NAME models
var rootDir = __dirname + '/schema';
fs.readdirSync(rootDir).forEach(function(file) {
  var res = file.match(/(.+)\.js$/);
  if (res) {
    var name = res[1];
    db[name] = mongoose.model(name, require(rootDir + '/' + file));
  }
});
