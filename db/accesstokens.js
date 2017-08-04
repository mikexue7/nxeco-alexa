// tokens array
var tokens = {};

// finds a token from the tokens array and returns it to the callback
exports.find = function(key, done) {
  var token = tokens[key];
  return done(null, token);
};

// saves a token into the tokens array
exports.save = function(token, userID, clientID, done) {
  tokens[token] = { userID: userID, clientID: clientID };
  return done(null);
};
