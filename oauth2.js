process.env.DEBUG = 'oauth2:*';
var oauth2orize = require('oauth2orize')
  , passport = require('passport')
  , login = require('connect-ensure-login')
  , db = require('./db')
  //, utils = require('./utils')
  , http = require('http')

// create OAuth 2.0 server
var server = oauth2orize.createServer();
var server_ip = 'www.rainconn.com';

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
  console.log("serializing client");
  return done(null, client.clientId);
});

server.deserializeClient(function(clientId, done) {
  console.log("deserializing client");
  db.clients.findByClientId(clientId, function(err, client) {
    if (err) { return done(err); }
    if (!client) { return done(new Error("No client")); }
    return done(null, client);
  });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant implicit authorization.  The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a token, which is bound to these
// values.

server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
    // token set to value of user to make it easier to obtain later
    var token = user;

    db.accessTokens.save(token, user, client.clientId, function(err) {
        if (err) { return done(err); }
        done(null, token);
    });
}));

// user authorization endpoint
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request.  In
// doing so, is recommended that the `redirectURI` be checked against a
// registered value, although security requirements may vary accross
// implementations.  Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectURI` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization).  We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view.

exports.authorization = [
  function (req, res, next) {
    console.log("##entered authorization");
    next();
  },
  login.ensureLoggedIn(),
  server.authorization(function(clientID, redirectURI, done) {
    console.log('entered server.authorization method');
    db.clients.findByClientId(clientID, function(err, client) {
      if (err) { console.log("error"); return done(err); }
      if (!client) { console.log("another error"); return done(null, false); }
      return done(null, client, redirectURI);
    });
  }),
  function(req, res) {
    console.log('##render dialog');
    res.render('dialog', { transactionID: req.oauth2.transactionID, user: user, client: req.oauth2.client });
  }
]

// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

exports.decision = [
  login.ensureLoggedIn(),
  server.decision()
]
