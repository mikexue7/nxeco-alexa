var passport = require('passport');
var login = require('connect-ensure-login');

// get layout
exports.index = function (req, res) {
  console.log("layout loaded");
  res.render('layout');
}

// get login form
exports.loginForm = function (req, res) {
  console.log("login page loaded");
  res.render('login');
}

// post login form
exports.login = passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' });

// logout
exports.logout = function (req, res) {
  req.logout();
  res.redirect('/');
}
