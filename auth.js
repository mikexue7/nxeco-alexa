const passport = require('passport'),
      LocalStrategy = require('passport-local').Strategy,
      http = require('http'),
      crypto = require('crypto');

const server_ip = 'www.rainconn.com';

// LocalStrategy used to authenticate users based on email and passport entered in NxEco login form
passport.use(new LocalStrategy(
  function (username, password, done) {
    var md5_passwd = crypto.createHash('md5').update(password).digest('hex');
    var path = '/api/rest/client/login?&email=' + username + '&passwd=' + md5_passwd;
    var options = {
      host: server_ip,
      port: 80,
      path: path,
      method: 'GET'
    }
    var req = http.request(options, function (res) {
      console.log("request is processing");
      res.setEncoding('utf8');
      var body = "";
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log("Request successful");
          var obj = JSON.parse(body);
          if (obj.error === 200) {
            var user = obj.data.id
            console.log("User authenticated successfully");
            return done(null, user);
          } else {
            console.log("Invalid email or password");
            return done(null, false, { message: "Invalid email or password." });
          }
        } else {
          console.log("Request failed");
          return done(new Error("Request failed"));
        }
      });
      req.on('error', (err) => {
        console.log(err.message);
        return done(err);
      });
    });
    req.end();
  }
));

// serialize/deserialize users in passport
passport.serializeUser(function(user, done) {
  console.log("serializing user");
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  console.log("deserializing user");
  done(null, id);
});
