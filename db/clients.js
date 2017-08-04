// clients array; supported clients are Google Home and Amazon Echo
const clients = [
  { id: '1', name: 'Google Home', clientId: 'google', clientSecret: 'ssh-secret', isTrusted: false },
  { id: '2', name: 'Amazon Echo', clientId: 'amazon', clientSecret: 'ssh-password', isTrusted: false },
];

// returns the client in the array given by the proper id to the done callback
exports.findById = function (id, done) {
  for (var i = 0; i < clients.length; i++) {
    if (clients[i].id === id) {
      return done(null, clients[i]);
    }
  }
  return done(null, null);
};

// returns the client in the array given by the proper clientId to the done callback
exports.findByClientId = function (clientId, done) {
  console.log("entered findByClientId");
  for (var i = 0; i < clients.length; i++) {
    if (clients[i].clientId === clientId) {
      console.log("client found");
      return done(null, clients[i]);
    }
  }
  console.log("client not found");
  return done(null, null);
};
