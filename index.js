var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var apiAccess = require("apiAccess");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

var webshot = require('webshot');
var fs      = require('fs');

// Server index page
app.get("/", function (req, res) {
  res.send("Deployed!");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  }
});

// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
  // Make sure this is a page subscription
  if (req.body.object == "page") {
    // Iterate over each entry
    // There may be multiple entries if batched
    req.body.entry.forEach(function(entry) {
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.postback) {
          processPostback(event);
        } else if (event.message) {
        	processMessage(event);
        }
      });
    });

    res.sendStatus(200);
  }
});

function processMessage(event) {
  if (!event.message.is_echo) {
    var message = event.message;
    var senderID = event.sender.id;

    console.log("Received message from senderId: " + senderID);
    console.log("Message is: " + JSON.stringify(message));

    // You may get a text or attachment but not both
    if (message.text) {
    	if (message.text == "help"){
    		sendMessage(senderID, {text: "To get the schedule of a course, please enter the full course number. Ex. CS241."});
    	}
    	else {
    		apiAccess.getTerm(function(num) {
    			var parsedCourse = message.text.split(/(\d+)/);
     			var url = "http://www.adm.uwaterloo.ca/cgi-bin/cgiwrap/infocour/salook.pl?level=under&sess="+num+"&subject="+parsedCourse[0]+"&cournum="+parsedCourse[1];
  			   	var renderStream = webshot(url);
				var file = fs.createWriteStream('google.png', {encoding: 'binary'});
    	
  				renderStream.on('data', function(data) {
			    	file.write(data.toString('binary'), 'binary');
		 		});

				// sendImage(senderID, {text: file});
    		});
    	}
  //   	 

    } else if (message.attachments) {
      sendMessage(senderID, {text: "Sorry, I don't understand your request."});
    }
  }
}

function processPostback(event) {
  var senderId = event.sender.id;
  var payload = event.postback.payload;

  if (payload === "Greeting") {
    // Get user's first name from the User Profile API
    // and include it in the greeting
    request({
      url: "https://graph.facebook.com/v2.6/" + senderId,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        name = bodyObj.first_name;
        greeting = "Hi " + name + ". ";
      }
      var message = greeting + "Hi! To check a class schedule, simply type the course number followed by the academic session.";
      sendMessage(senderId, {text: message});
    });
  }
}

// sends message to user
function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}
function sendImage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: {
      	attachment: {
      		type: "image",
      		payload: message,
      		is_reusable: true
      	}
      }
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}