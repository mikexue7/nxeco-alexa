var express = require('express'),
      passport = require('passport'),
      session = require('express-session'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      mongoose = require('mongoose'),
      MongoStore = require('connect-mongo')(session),
      RedisStore = require('connect-redis')(session),
      redis = require('redis'),
      logger = require('morgan'),
      errorHandler = require('express-error-handler'),
      site = require('./site'),
      oauth2 = require('./oauth2'),
      port = process.env.PORT || 8080;

var app = express();

var redisClient = redis.createClient(8080, 'localhost');

// mongodb connection

// mongoose.connect("mongodb://localhost:27017/alexa", { useMongoClient: true });
// var db = mongoose.connection;

// mongo error

// db.on('error', console.error.bind(console, 'connection error:'));

// use sessions for tracking logins
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: false,
  // store: new MongoStore({
  //   mongooseConnection: db
  // })
  store: new RedisStore({
    client: redisClient,
    host: "pub-redis-14280.us-central1-1-1.gce.garantiadata.com",
    port: 14280,
	 	ttl: 260
   })
}));

app.use(cookieParser());
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: 'application/json' }));

app.use(passport.initialize());
app.use(passport.session());
app.use(errorHandler({ dumpExceptions: true, showStack: true }));

// use ejs as file extension for views
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

// use passport
require('./auth');

// Account linking
app.get('/', site.index);
app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);

app.get('/authorize', oauth2.authorization);
app.post('/authorize/decision', oauth2.decision);

// set up local server
if (module === require.main) {
	// [START server]
	// Start the server
	var server = app.listen(process.env.PORT || 8080, function () {
    	var port = server.address().port;
    	console.log('App listening on port %s', port);
	});
	// [END server]
}

module.exports = app;
