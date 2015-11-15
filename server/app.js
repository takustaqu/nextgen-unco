var express = require('express');
var morgan = require('morgan')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var credentials = require('./credentials.json');
var db = require('./db');
var router = express.Router();
var session = require('express-session')({
  secret: 'my-secret',
  resave: true,
  saveUninitialized: true
});
var sharedsession = require('express-socket.io-session');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/../ui_designing/source/ejs');

var accessLogStream = require('fs').createWriteStream(__dirname + '/access.log', {
  flags: 'a'
});

// setup the logger
app.use(morgan('combined', {
  stream: accessLogStream
}));
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
// Use express-session middleware for express
app.use(session);
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
  .get('/panorama.html', function(req, res) {
    res.set('Content-Type', 'text/html');
    res.sendFile(__dirname + '/public/panorama.html')
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
    });

    // 結果のIDのうち1つを選んでTwilioに発信する
    if (alert == '1') {
      var callerSessionId = req.session.id;
      if (toilets.length > 0) {
        executeCall(callerSessionId, toilets[0].id, function(err, result) {
          console.log(err, result);
        });
      }

      // 2件以上結果があるときは、自動応答する
      if (toilets.length > 1) {
        for (var i = 1; i < toilets.length; ++i) {
          (function(toiletId, i) {
            setTimeout(function() {

              // トイレ許可・拒否の返答
              io.to(callerSessionId).emit('toiletResponse', {
                ok: Math.random() > 0.9,
                id: toiletId
              });

            }, Math.random() * 3000 + 1000 * i);
          })(toilets[i].id, i);
        }
      }
    }
    res.json(toilets);
  }, next);

});

router.get('/api/get_toilet_detail.:format?', function(req, res, next) {

  var id = req.query.id;

  if (!id) {
    return next(new Error('bad request'));
  }

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

router.get('/api/twilio/:callerSessionId/:toiletId', function(req, res) {
  var callerSessionId = req.params.callerSessionId;
  var toiletId = req.params.toiletId;
  res.set('Content-Type', 'text/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n<Gather action="http://api.airwn.co/api/response/' + callerSessionId + '/' + toiletId + '" method="GET" timeout="10" numDigits="1">\n<Say voice="alice" language="ja-jp">緊急です。近くでトイレを貸して欲しがっている人がいます。貸してあげても良い場合は、1を押してください。</Say>\n</Gather>\n<Say voice="alice" language="ja-jp">タイムアウトしました。</Say>\n</Response>');
});

// ユーザーが応答したら呼ばれる
router.get('/api/response/:callerSessionId/:toiletId', function(req, res) {

  var callerSessionId = req.params.callerSessionId;
  var toiletId = req.params.toiletId;

  res.set('Content-Type', 'text/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?>\n<Response><Say voice="alice" language="ja-jp">ありがとうございました。</Say></Response>');

  // トイレ許可・拒否の返答
  io.to(callerSessionId).emit('toiletResponse', {
    ok: req.query.Digits === '1',
    id: toiletId
  });
});

server.listen(80);

function executeCall(callerSessionId, toiletId, callback) {

  // Twilio Credentials 
  var accountSid = credentials.twilio.accountSid;
  var authToken = credentials.twilio.authToken;

  //require the Twilio module and create a REST client 
  var client = require('twilio')(accountSid, authToken);

  client.calls.create({
    to: "+818020314368",
    from: credentials.twilio.from,
    url: 'http://api.airwn.co/api/twilio/' + callerSessionId + '/' + toiletId,
    method: "GET",
    fallbackMethod: "GET",
    statusCallbackMethod: "GET",
    record: "false"
  }, callback);

}

// Use shared session middleware for socket.io
// setting autoSave:true
io.use(sharedsession(session, {
  autoSave: true
}));

io.on('connection', function(socket) {
  socket.join(socket.handshake.session.id)
  console.log('Session ID ' + socket.handshake.session.id);
});
