var express = require('express');
var router = express.Router();
var request = require('request');

const VERIFICATION_TOKEN = "toykents_shopcast";
const PAGE_ACCESS_TOKEN = "EAAD8qRUJrBABANZBOT77hvWhimiKnNJFU01z1lian5rtFbb8fY45UAUVpNXhHG3S1ZB1T3Sy6apVxxLql5e10qUZBZATysAem5sTqrQZCOPtr1qtmHS2Ida16oOAjOpk1ZAKQe4APjDPV05Ag78WJMSZC4S8Ftkot1h8CgzqCZBJ3wZDZD";

/* webhook start */
router.get('/', function(req, res, next) {
  if (req.query["hub.verify_token"] === VERIFICATION_TOKEN) {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  }
});

// All callbacks for Messenger will be POST-ed here
router.post('/', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          if (event.message.quick_reply) {
            receivedPayloadEvent(event);
          } else {
            receivedMessageEvent(event);
          }
        } else if (event.postback) {
          receivedPostbackEvent(event);     
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

function receivedPayloadEvent(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message.text;

  console.log(JSON.stringify(event));
  console.log("Received payload for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message;
  if (messageText) {
    switch (messageText) {
      case 'Promos':
        sendLocationButton(senderID);
        break;
      case 'Events':
        sendLocationButton(senderID);
    }
  } else if (messageAttachments) {
    // if(messageAttachments[0].payload.coordinates)
    console.log("Message Attachments:", messageAttachments[0].payload.coordinates);
    if(messageAttachments[0].type == 'location') {
      sendPromoMessage(senderID, messageAttachments[0].payload.coordinates);
    }
    //sendTextMessage(senderID, "Message with attachment received");
  }
}


function receivedMessageEvent(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log(JSON.stringify(event));
  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
      default:
        console.log("Default message");
        if (messageText.indexOf('location') !== -1) {
          sendLocationButton(senderID);
        } else {
          sendTextMessage(senderID, messageText);
        }
    }
  } else if (messageAttachments) {
    // if(messageAttachments[0].payload.coordinates)
    console.log("Message Attachments:", messageAttachments[0].payload.coordinates);
    if(messageAttachments[0].type == 'location') {
      sendPromoMessage(senderID, messageAttachments[0].payload.coordinates);
    }
    //sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendGreeting() {
    var data = {
        setting_type: "greeting",
        greeting: {
            text: "Hi {{user_first_name}}, find out what’s on sale, and discover lifestyle events nearby!"
        }
    };

    request({
        uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: {
            access_token: PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: data

    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent greeting message to", recipientId);
        } else {
            console.error("Unable to send message.");
            // console.error(response);
            console.error(error);
        }
    });
}

sendGreeting();

function sendLocationButton(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Please share your location:",
      quick_replies:[
        {
          content_type:"location",
        }
      ]
    }
  };
  console.log("sendLocationButton: ", messageData);
  callSendAPI(messageData);
}

function sendChoiceButton(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What do you want to know?",
      quick_replies:[
        {
          "content_type":"text",
          "title":"Promos",
          "payload":"Promos"
        },
        {
          "content_type":"text",
          "title":"Events",
          "payload":"Events"
        }
      ]
    }
  };
  console.log("sendChoiceButton: ", messageData);
  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  console.log("sendTextMessage: ", messageData);
  callSendAPI(messageData);
}



function receivedPostbackEvent(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);
  
  switch(payload) {
    case 'GET_STARTED_PAYLOAD': 
      sendChoiceButton(senderID);
      break;
    default: 
      // When a postback is called, we'll send a message back to the sender to 
      // let them know it was successful
      sendTextMessage(senderID, "Postback called");
  }
  
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  
  callSendAPI(messageData);
}

function sendPromoMessage(recipientId, coordinates) {
  const lat = coordinates.lat;
  const long = coordinates.long
  request({
    uri: 'https://api.shopcast.ph/v2/posts',
    qs: { group_offers: true,
          lat: lat,
          lng: long,
          merchant_photo: true,
          page: 1,
          pagesize: 100,
          radius: 99
         },
    method: 'GET'
  }, function (error, response, body) {
    console.log("response: ", response);
    console.log("body: ", body);
    console.log("error: ", error);
    const posts = JSON.parse(body);
    const elements = [];
    for(var i = 0; i < 4; i++) {
      elements.push({
        title: posts[i].title,
        subtitle: posts[i].summary,
        item_url: "http://shopcast.ph/map/post/" + posts[i].offer_id,           
        image_url: "https://s3-ap-southeast-1.amazonaws.com/shopcastbucket/post/photo/" + posts[i].photo_file,
        buttons: [{
          type: "web_url",
          url: "https://www.oculus.com/en-us/rift/",
          title: "Open Web URL"
        }]
      });
    }

    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "list",
            elements: elements
          }
        }
      }
    };  

    callSendAPI(messageData);
  }); 
}

function sendEventsMessage(recipientId, coordinates) {
  const lat = coordinates.lat;
  const long = coordinates.long
  request({
    uri: 'https://api.shopcast.ph/v2/events',
    qs: { group_offers: true,
          lat: lat,
          lng: long,
          merchant_photo: true,
          page: 1,
          pagesize: 100,
          radius: 99
         },
    method: 'GET'
  }, function (error, response, body) {
    console.log("response: ", response);
    // console.log("body: ", body);
    console.log("error: ", error);
    const posts = JSON.parse(body);
    const elements = [];
    for(var i = 0; i < 4; i++) {
      elements.push({
        title: posts[i].title,
        subtitle: posts[i].summary,
        item_url: "http://shopcast.ph/map/post/" + posts[i].offer_id,           
        image_url: "https://s3-ap-southeast-1.amazonaws.com/shopcastbucket/post/photo/" + posts[i].photo_file,
        buttons: [{
          type: "web_url",
          url: "https://www.oculus.com/en-us/rift/",
          title: "Open Web URL"
        }]
      });
    }

    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "list",
            elements: elements
          }
        }
      }
    };  

    callSendAPI(messageData);
  }); 
}

function callSendAPI(messageData) {
  console.log("callSendAPI: ", messageData);
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData
  }, function (error, response, body) {
    console.log("response: ", response);
    console.log("body: ", body);
    console.log("error: ", error);
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

module.exports = router;