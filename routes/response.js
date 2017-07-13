
export const sendPromoMessage = function(recipientId, coordinates) {
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

export const sendEventsMessage = function(recipientId, coordinates) {
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

export const callSendAPI = function(messageData) {
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