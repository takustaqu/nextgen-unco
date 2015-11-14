var express = require('express');
var morgan = require('morgan')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var credentials = require('./credentials.json');
var db = require('./db');
var router = express.Router();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/../ui_designing/source/ejs');

var accessLogStream = require('fs').createWriteStream(__dirname + '/access.log', {
  flags: 'a'
});

// setup the logger
app.use(morgan('combined', {
  stream: accessLogStream
}));
app.use(router);
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/../ui_designing/build'));
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Serve ejs files
router
  .get('/', function(req, res) {
    res.render('index');
  })
  .get(/\/(.+).html/, function(req, res) {
    res.render(req.params[0]);
  });

router.get('/api/get_toilets.:format?', function(req, res, next) {

  var lat = req.query.lat;
  var lng = req.query.lng;
  var alert = req.query.alert;

  db.Toilet.find({}, {
    _id: 0,
    __v: 0,
    'image._id': 0,
    description: 0
  }).lean().exec().then(function(toilets) {

    // レビュー概要を作成
    toilets.forEach(function(toilet) {

      var rateAverage = 0;
      var rateCount = 0;
      var reviewCount = 0;

      // 平均と合計を計算
      if (toilet.review && toilet.review.length > 0) {
        toilet.review.forEach(function(item) {
          if (item.rate) {
            rateAverage += item.rate;
            ++rateCount;
          }

          if (item.comment) {
            ++reviewCount;
          }
        });

        rateAverage /= rateCount;
      }

      toilet.reviewOverview = {
        rateAverage: rateAverage,
        rateCount: rateCount,
        reviewCount: reviewCount
      };

      delete toilet.review;
    })

    res.json(toilets);
  }, next);

  // TODO
  if (alert == '1') {
    executeCall(function(err, result) {
      console.log(err, result);
    });
  }

});

router.get('/api/get_toilet_detail.:format?', function(req, res, next) {

  var id = req.query.id;

  if (!id) {
    return next(new Error('bad request'));
  }

  // TODO
  db.Toilet.findOne({
    id: id
  }, {
    _id: 0,
    __v: 0,
    'image._id': 0
  }).lean().exec().then(function(toilet) {

    if (!toilet) {
      return res.status(404).json({
        error: 'Not Found'
      });
    }

    // レビュー概要を作成

    var rateAverage = 0;
    var rateCount = 0;
    var reviewCount = 0;

    // 平均と合計を計算
    if (toilet.review && toilet.review.length > 0) {
      toilet.review.forEach(function(item) {
        if (item.rate) {
          rateAverage += item.rate;
          ++rateCount;
        }

        if (item.comment) {
          ++reviewCount;
        }
      });

      rateAverage /= rateCount;
    }

    toilet.reviewOverview = {
      rateAverage: rateAverage,
      rateCount: rateCount,
      reviewCount: reviewCount
    };

    res.json(toilet);
  }, next);

});

router.get('/api/get_user_detail.:format?', function(req, res, next) {

  var id = req.query.id;
  var username = req.query.username;

  var query = id ? {
    id: id
  } : {
    username: username
  };

  db.User.findOne(query, {
    _id: 0,
    __v: 0
  }).lean().exec().then(function(user) {

    if (!user) {
      return res.status(404).json({
        error: 'Not Found'
      });
    }

    res.json(user);
  }, next);

});

router.get('/api/request_toilet_use.:format?', function(req, res, next) {

  var id = req.query.id;

  db.Toilet.update({
    id: id
  }, {
    using: true
  }).exec().then(function(result) {
    
    if (result.n === 0) {
      return res.status(404).json({
        error: 'Not Found'
      });
    }

    res.json({
      ok: true
    });
  }, next);

  // TODO 連絡

});

// router.get('/test', function(req, res) {
//   res.send('ok');
// });

// ユーザーに電話をかける
router.get('/call', function(req, res, next) {

  // 電話をかける
  executeCall(function(err, result) {
    if (err) {
      next(err);
    } else {
      res.send(result);
    }
  });
});

// ユーザーが応答したら呼ばれる
router.get('/response.xml', function(req, res) {
  res.set('Content-Type', 'text/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?>\n<Response><Say voice="alice" language="ja-jp">ありがとうございました。</Say></Response>');

  // TODO トイレ許可
  if (req.query.Digits === '1') {
    io.sockets.emit('toiletFound', '0001');
  }
});

server.listen(80);

function executeCall(callback) {

  // Twilio Credentials 
  var accountSid = credentials.twilio.accountSid;
  var authToken = credentials.twilio.authToken;

  //require the Twilio module and create a REST client 
  var client = require('twilio')(accountSid, authToken);

  client.calls.create({
    to: "+818020314368",
    from: credentials.twilio.from,
    applicationSid: credentials.twilio.applicationSid,
    method: "GET",
    fallbackMethod: "GET",
    statusCallbackMethod: "GET",
    record: "false"
  }, callback);

}


io.on('connection', function(socket) {
  // socket.emit('news', {
  //   hello: 'world'
  // });
});
