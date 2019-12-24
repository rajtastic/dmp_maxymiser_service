// ServerLogger.js
const request = require('request-promise');

ServerLogger = {};

// CONFIG : Set Logging Endpoint
ServerLogger.LOG_ENDPOINT = (process.env.LOG_ENDPOINT) ? process.env.LOG_ENDPOINT : "";
ServerLogger.LOG_SERVER_STATUS = (process.env.LOG_SERVER_STATUS) ? process.env.LOG_SERVER_STATUS : "no";

// FUNCTION : Server-side Logging
ServerLogger.send = async function (message_object,serviceName) {

    // Check if logging is turned on
    if (ServerLogger.LOG_SERVER_STATUS === "no") {
        console.log("SERVER LOG : Log Rejected - logging turned off;")
        return;
    }

    // Check if 'message_object' is in JSON format
    if(typeof message_object !== "object"){
        console.log("SERVER LOG : Log Rejected - message_object not in JSON format;")
        return;
    }
            
    // Check for Service Name
    if (typeof serviceName === "undefined"){
        serviceName = "No Service Name Provided";
    }

    // Append Service Name
    message_object["serviceName"] = serviceName;

    // Send Log
    var response = await request({
        method: "POST",
        uri: ServerLogger.LOG_ENDPOINT,
        json: true,
        body: message_object,
        headers: { "Content-Type": "application/json" }
    }).then(function (res) {

        console.log("LOG : Server : Success");

    }).catch(function (err) {

        console.log("LOG : Server : Error");
        console.log(err);
    });

};

module.exports = ServerLogger;