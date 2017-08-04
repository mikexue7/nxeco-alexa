'use strict';

var Alexa = require('alexa-sdk');
var http = require('http');

var server_ip = 'www.rainconn.com';

var user_id, garden_id, dev_id;
var numOfGardens, numOfZones;

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: var APP_ID = "amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1";
var APP_ID = "amzn1.ask.skill.461b9c0e-7e09-40a0-b9c0-d11fa1860df5";

var SKILL_NAME = "NxEco Irrigation Controller";
var HELP_MESSAGE = `Which garden would you like to operate on?`;
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "Goodbye!";

// set up handler function
exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

// set up dialog support
function delegateSlotCollection() {
  console.log("in delegateSlotCollection");
  console.log("current dialogState: " + this.event.request.dialogState);
    if (this.event.request.dialogState === "STARTED") {
      console.log("in Beginning");
      var updatedIntent = this.event.request.intent;
      console.log(updatedIntent);
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      this.emit(":delegate", updatedIntent);
    } else if (this.event.request.dialogState !== "COMPLETED") {
      console.log("in not completed");
      // return a Dialog.Delegate directive with no updatedIntent property.
      this.emit(":delegate");
    } else {
      console.log("in completed");
      console.log("returning: "+ JSON.stringify(this.event.request.intent));
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
      return this.event.request.dialogState;
    }
}

// obtain number of gardens available for use
function getNumOfGardens (callback) {
  var path = '/api/rest/client/getgardeninfo?&userid=' + user_id;
  var options = {
    hostname: server_ip,
    port: 80,
    path: path,
    method: 'GET'
  }
  console.log('about to enter request');
  var req = http.request(options, (res) => {
    console.log('entered request');
    if (res.statusCode === 200) {
      console.log('successful request');
      res.setEncoding('utf8');
      var body = "";
      res.on('data', (chunk) => {
        console.log('adding data');
        body += chunk.toString();
      });
      res.on('end', () => {
        var obj = JSON.parse(body);
        console.log('successfully parsed');
        if (obj.error === 200) {
          console.log('##gardenid successfully obtained');
          callback(obj.data.length);
        } else {
          console.log("parsing error");
        }
      });
    } else {
      console.log('failed request');
    }
  });
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.on('finish', () => {
    console.log('ended');
  });
  req.end();
}

// obtain garden id given a garden number and user id
function getGardenId (gardenNumber, callback) {
  var path = '/api/rest/client/getgardeninfo?&userid=' + user_id;
  var options = {
    hostname: server_ip,
    port: 80,
    path: path,
    method: 'GET'
  }
  console.log('about to enter request');
  var req = http.request(options, (res) => {
    console.log('entered request');
    if (res.statusCode === 200) {
      console.log('successful request');
      res.setEncoding('utf8');
      var body = "";
      res.on('data', (chunk) => {
        console.log('adding data');
        body += chunk.toString();
      });
      res.on('end', () => {
        var obj = JSON.parse(body);
        console.log('successfully parsed');
        if (obj.error === 200) {
          console.log('##gardenid successfully obtained');
          callback(obj.data[gardenNumber - 1].id);
        } else {
          console.log("parsing error");
        }
      });
    } else {
      console.log('failed request');
    }
  });
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.on('finish', () => {
    console.log('ended');
  });
  req.end();
}

// obtain device id based on garden id and user id
function getDevId (gardenId, callback) {
  var path = '/api/rest/client/getdevbygid?&userid=' + user_id + '&gardenid=' + gardenId;
  var options = {
    host: server_ip,
    port: 80,
    path: path,
    method: 'GET'
  }
  var req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      res.setEncoding('utf8');
      var body = ""
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        var obj = JSON.parse(body);
        if (obj.error === 200) {
          console.log(`##device id successfully obtained, value is ${obj.data.id}`);
          callback(obj.data.id);
        } else {
          console.log('parsing error');
        }
      });
    } else {
      console.log('failed request');
    }
  });
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.on('finish', () => {
    console.log('ended');
  });
  req.end();
}

// obtain number of zones for a certain garden (dev_id)
function getNumOfZones (callback) {
  var path = '/api/rest/client/getzone?&devid=' + dev_id;
  var options = {
    host: server_ip,
    port: 80,
    path: path,
    method: 'GET'
  };
  var req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      var body = "";
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        var obj = JSON.parse(body);
        if (obj.error === 200) {
          console.log('##number of zones successfully obtained');
          callback(obj.data.length);
        } else {
          console.log('parsing error');
        }
      });
    } else {
      console.log('failed request');
    }
  });
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.on('finish', () => {
    console.log('ended');
  });
  req.end();
}

// start watering a zone for a certain duration
function startWatering (zone, duration, callback) {
  var path = '/api/rest/client/sendcommand?&devid=' + dev_id + '&command=RainOnce&params=param:3;type:1;whichvalve:' + zone + ';howlong:' + duration + '&srcip=&srctype=5';
  var options = {
    host: server_ip,
    port: 80,
    path: path,
    method: 'GET'
  };
  var req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('successful request');
      callback();
    } else {
      console.log('failed request');
    }
  });
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.on('finish', () => {
    console.log('ended');
  });
  req.end();
}

// stop watering a certain zone
function stopWatering (zone, callback) {
  var path = '/api/rest/client/sendcommand?&devid=' + dev_id + '&command=RainClose&params=param:2;type:1;whichvalve:' + zone;
  var options = {
    host: server_ip,
    port: 80,
    path: path,
    method: 'GET'
  };
  var req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('successful request');
      callback();
    } else {
      console.log('failed request');
    }
  });
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.on('finish', () => {
    console.log('ended');
  });
  req.end();
}

// get the valve/watering status (what is currently on and what is in line)
function getValveStatus (callback) {
  var path = '/api/rest/client/getvalvestatus?&devid=' + dev_id;
  var options = {
    host: server_ip,
    port: 80,
    path: path,
    method: 'GET'
  };
  var req = http.request(options, (res) => {
    var body = "";
    var operatingValve;
    var inLineValves;
    if (res.statusCode === 200) {
      console.log('successful request');
      res.on('data', (data) => {
        body += data;
      });
      res.on('end', () => {
        console.log(body);
        var obj = JSON.parse(body);
        if (obj.error === 200) {
          operatingValve = obj.data.now;
          inLineValves = obj.data.inline;
          console.log(operatingValve, inLineValves);
          callback(operatingValve, inLineValves);
        } else {
          console.log("parsing error");
        }
      });
    } else {
      console.log('failed request');
    }
  });
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.on('finish', () => {
    console.log('ended');
  });
  req.end();
}

// delay watering for a time interval in hours
function delayWatering (intervalInHours, callback) {
  var path = '/api/rest/client/updateraindelay?&devid=' + dev_id + '&interv=' + intervalInHours * 60;
  var options = {
    host: server_ip,
    port: 80,
    path: path,
    method: 'GET'
  }
  var req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('successful request');
      callback();
    } else {
      console.log('failed request');
    }
  });
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.on('finish', () => {
    console.log('ended');
  });
  req.end();
}

// get time left for water delay
function getWaterDelay (callback) {
  var path = '/api/rest/client/getraindelay?&devid=' + dev_id;
  var options = {
    host: server_ip,
    port: 80,
    path: path,
    method: 'GET'
  }
  var req = http.request(options, (res) => {
    var body = "";
    if (res.statusCode === 200) {
      console.log('successful request');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        var obj = JSON.parse(body);
        if (obj.error === 200) {
          console.log('##water delay successfully obtained');
          callback(obj.data.remaintime);
        } else {
          console.log('parsing error');
        }
      });
    } else {
      console.log('failed request');
    }
  });
  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.on('finish', () => {
    console.log('ended');
  });
  req.end();
}

// handle the intents
var handlers = {
    'LaunchRequest': function () {
      user_id = this.event.session.user.accessToken;
      if (user_id !== undefined) {
        var self = this;
        getNumOfGardens(function (numberOfGardens) {
          numOfGardens = numberOfGardens;
          var speechOutput = `You have ${numOfGardens} gardens. ` + HELP_MESSAGE;
          var reprompt = 'To choose a garden, you can say garden 1.';
          self.emit(':ask', speechOutput, reprompt);
        });
      } else {
        var speechOutput = 'Please link your account in the Alexa app first.';
        this.emit(':tellWithLinkAccountCard', speechOutput);
      }
    },
    'SelectGardenIntent': function () {
      var finalState = delegateSlotCollection.call(this);
      if (finalState === 'COMPLETED') {
        var gardenNumber = this.event.request.intent.slots.Garden.value;
        user_id = this.event.session.user.accessToken;
        if (user_id !== undefined) {
          var intentObj = this.event.request.intent;
          if (intentObj.confirmationStatus !== 'CONFIRMED') {
              if (intentObj.confirmationStatus !== 'DENIED') {
                  // Intent is not confirmed
                  var speechOutput = `Are you sure you would like to select garden ${gardenNumber}?`;
                  var repromptSpeech = speechOutput;
                  this.emit(':confirmIntent', speechOutput, repromptSpeech);
              } else {
                  // Users denies the confirmation of intent. May be value of the slots are not correct.
                  this.emit(':tell', 'OK, no garden has been selected.');
              }
          } else {
            var self = this;
            getGardenId(gardenNumber, function (gardenId) {
              getDevId(gardenId, function (devId) {
                garden_id = gardenId;
                dev_id = devId;
                getNumOfZones(function(numberOfZones) {
                  numOfZones = numberOfZones;
                  var speechOutput = `OK, garden ${gardenNumber} selected. This garden has ${numOfZones} zones. What would you like to do?`;
                  var reprompt = 'What would you like to do?'
                  self.emit(':ask', speechOutput, reprompt);
                });
              });
            });
          }
        } else {
          var speechOutput = 'Please link your account in the Alexa app first.';
          this.emit(':tellWithLinkAccountCard', speechOutput);
        }
      }
    },
    'StartWateringIntent': function () {
      var finalState = delegateSlotCollection.call(this);
      if (finalState === 'COMPLETED') {
        var zone = this.event.request.intent.slots.Zone.value;
        var duration = this.event.request.intent.slots.Duration.value;
        if (dev_id !== undefined) {
          var intentObj = this.event.request.intent;
          if (intentObj.confirmationStatus !== 'CONFIRMED') {
              if (intentObj.confirmationStatus !== 'DENIED') {
                  // Intent is not confirmed
                  var speechOutput = `Are you sure you would like to water zone ${zone} for ${duration} minutes?`;
                  var repromptSpeech = speechOutput;
                  this.emit(':confirmIntent', speechOutput, repromptSpeech);
              } else {
                  // Users denies the confirmation of intent. May be value of the slots are not correct.
                  this.emit(':tell', `OK, zone ${zone} will not be watered.`);
              }
          } else {
            var self = this;
            startWatering(zone, duration, function () {
              self.emit(':tell', `OK, watering zone ${zone} of this garden for ${duration} minutes.`);
            });
          }
        } else {
          this.emit(':tell', 'You need to first select a garden.');
        }
      }
    },
    'StopWateringIntent': function () {
      var finalState = delegateSlotCollection.call(this);
      if (finalState === 'COMPLETED') {
        var zone = this.event.request.intent.slots.Zone.value;
        if (dev_id !== undefined) {
          var intentObj = this.event.request.intent;
          if (intentObj.confirmationStatus !== 'CONFIRMED') {
              if (intentObj.confirmationStatus !== 'DENIED') {
                  // Intent is not confirmed
                  var speechOutput = `Are you sure you would like to stop watering zone ${zone}?`;
                  var repromptSpeech = speechOutput;
                  this.emit(':confirmIntent', speechOutput, repromptSpeech);
              } else {
                  // Users denies the confirmation of intent. May be value of the slots are not correct.
                  this.emit(':tell', `OK, zone ${zone} will continue watering.`);
              }
          } else {
            var self = this;
            stopWatering(zone, function() {
              self.emit(':tell', `OK, no longer watering zone ${zone} of this garden.`);
            });
          }
        } else {
          this.emit(':tell', 'You need to first select a garden.');
        }
      }
    },
    'GetValveStatusIntent': function () {
      var self = this;
      if (dev_id !== undefined) {
        getValveStatus(function (operatingValve, inLineValves) {
          console.log(operatingValve, inLineValves);
          if (operatingValve && inLineValves) {
            self.emit(':tell', 'In this garden, valve ' + operatingValve + ' is currently on, and valves ' + inLineValves + ' are in line.');
          } else if (operatingValve && !inLineValves) {
            self.emit(':tell', 'In this garden, valve ' + operatingValve + ' is currently on, and no valves are in line.');
          } else if (!operatingValve && inLineValves) {
            self.emit(':tell', 'In this garden, no valve is currently on, and valves ' + inLineValves + ' are in line.');
          } else {
            self.emit(':tell', 'In this garden, no valves are operating nor in line.');
          }
        });
      } else {
        this.emit(':tell', 'You need to first select a garden.');
      }
    },
    'DelayWateringIntent': function () {
      var finalState = delegateSlotCollection.call(this);
      if (finalState === 'COMPLETED') {
        var intervalInHours = this.event.request.intent.slots.IntervalInHours.value;
        if (dev_id !== undefined) {
          var intentObj = this.event.request.intent;
          if (intentObj.confirmationStatus !== 'CONFIRMED') {
              if (intentObj.confirmationStatus !== 'DENIED') {
                  // Intent is not confirmed
                  var speechOutput = `Are you sure you would like to delay watering for ${intervalInHours} hours?`;
                  var repromptSpeech = speechOutput;
                  this.emit(':confirmIntent', speechOutput, repromptSpeech);
              } else {
                  // Users denies the confirmation of intent. May be value of the slots are not correct.
                  this.emit(':tell', 'OK, no delay has been set.');
              }
          } else {
            var self = this;
            delayWatering(intervalInHours, function () {
              if (intervalInHours !== 1) {
                self.emit(':tell', `OK, delaying watering in this garden for ${intervalInHours} hours.`);
              } else {
                self.emit(':tell', `OK, delaying watering in this garden for ${intervalInHours} hour.`)
              }
            });
          }
        } else {
          this.emit(':tell', 'You need to first select a garden.');
        }
      }
    },
    'GetWaterDelayIntent': function () {
      var self = this;
      if (dev_id !== undefined) {
        getWaterDelay(function (waterDelayInSeconds) {
          if (waterDelayInSeconds === 0) {
            self.emit(':tell', 'There is no delay time right now.');
          } else if (waterDelayInSeconds < 60) {
            self.emit(':tell', `The remaining delay time is about ${waterDelayInSeconds} seconds.`);
          } else if (waterDelayInSeconds < 3600) {
            var waterDelayInMinutes = Math.round(waterDelayInSeconds / 60);
            self.emit(':tell', `The remaining delay time is about ${waterDelayInMinutes} minutes.`);
          } else {
            var waterDelayInHours = Math.round(waterDelayInSeconds / 3600);
            self.emit(':tell', `The remaining delay time is about ${waterDelayInHours} hours.`)
          }
        });
      } else {
        this.emit(':tell', 'You need to first select a garden.');
      }
    },
    'AMAZON.HelpIntent': function () {
      var speechOutput;
      if (numOfGardens !== undefined) {
        speechOutput = `You have ${numOfGardens} gardens. ` + HELP_MESSAGE;
      } else {
        speechOutput = HELP_MESSAGE;
      }
      var reprompt = HELP_REPROMPT;
      this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
      this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.StopIntent': function () {
      this.emit(':tell', STOP_MESSAGE);
    }
};
