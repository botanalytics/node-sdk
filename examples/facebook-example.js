'use strict';

var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()
var jsonParser = bodyParser.json()

if (!process.env.FACEBOOK_VERIFY_TOKEN) {
  throw new Error('"FACEBOOK_VERIFY_TOKEN" environment variable must be defined');
}

if (!process.env.BOTANALYTICS_TOKEN) {
  throw new Error('"BOTANALYTICS_TOKEN" environment variable must be defined');
}

if (!process.env.FACEBOOK_PAGE_TOKEN) {
  throw new Error('"FACEBOOK_PAGE_TOKEN" environment variable must be defined');
}


const Botanalytics = require('botanalytics').FacebookMessenger(process.env.BOTANALYTICS_TOKEN);

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === process.env.FACEBOOK_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    var data = req.body; 
    Botanalytics.logIncomingMessage(req.body);
  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;


      // Iterate over each messaging event
        entry.messaging.forEach(function(event) {
          var sender = event.sender.id;
          // if(!pausedUsers[sender]){
          if (event.message.is_echo) {
            console.log(event.message);
            //receivedMessage(event);
          }else if (event.message) {
            console.log(event.message);
            //receivedMessage(event);
          } else {
            console.log("Webhook received unknown event: ", event);
          }
        //}
        })
    })
    res.sendStatus(200);
  }
})

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    sendTextMessage(senderID, messageText);
     
  }
}

function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:process.env.FACEBOOK_PAGE_TOKEN},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })

    Botanalytics.logOutgoingMessage(messageData,sender,process.env.FACEBOOK_PAGE_TOKEN);
}





