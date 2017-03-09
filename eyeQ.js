const WebSocket = require('ws');
var fs = require('fs');

/**
 * Configuration
 */
try {
    var file = fs.readFileSync("config.json", "utf8");
    var config = JSON.parse(file);
    log("DeviceID: " + config.device.id);
} catch(e) {
    console.error("File config.json not found or is invalid. " + e);
    process.exit(1);
}


/**
 * Debug log
 */
function log(message) {
  if (config.debug) {
    console.log(message);
  }
}

/**
 * Gets the current time in millis
 */
function getTimeMillis(){
    return parseInt(Date.now().toString());
}

//var fs = require('fs');
var sdid = config.device.id;
var token = config.device.token;
var cid = getTimeMillis() + "";

const ws = new WebSocket('wss://api.artik.cloud/v1.1/websocket?ack=true', {
  perMessageDeflate: false
});

// Register the deviceId
ws.on('open', function open() {
  console.log("Registering device on the WebSocket connection " );
  try{
    var registerMessage = {
      "type": "register",
      "sdid": sdid,
      "Authorization": "bearer " + token,
      "cid": cid
    };
    ws.send(JSON.stringify(registerMessage), { mask: true });
  }
  catch (e) {
      console.error('Failed to register messages. Error in registering message: ' + e.toString());
  }
});

ws.on('message', function(data) {
  log("Received message: " + data + '\n');
  var message = JSON.parse(data);
  if (message.hasOwnProperty("error")) {
    console.error("Error opening websocket: " + data)
  } else if (message.hasOwnProperty("type")) {
    var type = message.type;

    if (type === "ping") {
      // WS is alive
    } else if (type === "message") {
      // Handle message
    } else if (type === "action") {
      var action = message.data.actions[0];
      log("The received action is " + action.name);
    }
  } else if (message.hasOwnProperty("data")) {
    if (message.data.hasOwnProperty("code")) {
        if (message.data.cid === cid) {
          log("Device Registration: " + message.data.message);
          // Start Sending messages
          setInterval(function() {
            try{
                var data = {
                      "person": {
                          "gender": "M",
                          "age": 10,
                          "sentiment": "happy",
                          "repeatTime": 4,
                          "macId": "000FFAA"
                      }
                    };
                var payload = {
                  "sdid": sdid,
                  "ts": getTimeMillis(),
                  "data": data
                };

                log('Sending payload ' + JSON.stringify(payload) + '\n');
                ws.send(JSON.stringify(payload), {mask: true});
            } catch (e) {
                console.error('Error in sending a message: ' + e.toString() +'\n');
            }
          }, 300000);
        }
    } else if (message.data.hasOwnProperty("mid")) {

    }
  } else {
    //console.log(data);
  }
});


ws.on('close', function() {
  log("WebSocket connection is closed ....");
});
