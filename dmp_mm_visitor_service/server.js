// server.js

// REQUIRES
require("./src/config"); // config file

const Environment = require('./src/Environment');
const Logger = require('./src/Logger');
const ServerLogger = require('./src/ServerLogger');
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const Visitor = require("./src/Visitor");

app.use(bodyParser.json())

// Auto Config
if (Environment() !== "dev") { global.log_verbose = 4 };

// Notes
Logger("DEV REQUIRED : Auth Service API : Set set up auth URL via image", 1);

// ROUTES

// HEALTHCHECK
app.get("/health", (req, res) => {
	
	Logger("ENDPOINT : /health : endpoint called", 2);
	
	let message = "DMP MM Visitor Service App is healthy";
	res.send(message);

	ServerLogger.send(message,"Visitor Service"); // Send message to Log Server

});

// SEND DMP DATA TO MM
app.post("/receive_data/:id", async (req, res) => {

	Logger("ENDPOINT : /receive_data/:id : endpoint called", 2);

	// Syntax Check : site ID?
	if (req.params.id) {
		var endpoint_type = req.params.id;
	} else {
		res.status(400) // error handling
		let message = {
			status: "FAIL",
			message: "No Integration ID Specified"
		};
		res.json(message);

		ServerLogger.send(message,"Visitor Service"); // Send message to Log Server
	}

	if (endpoint_type !== "mm") {
		res.status(400) // error handling

		let message = {
			status: "FAIL",
			message: "Invalid Integration ID"
		};
		res.json(message);

		ServerLogger.send(message,"Visitor Service"); // Send message to Log Server
	}

	// Syntax Check : Payload?
	if (req.body && req.body.Pixels[0] && req.body.Pixels[0].PartnerUuid && req.body.Pixels[0].CampaignId && req.body.Pixels[0].PixelUrl && req.body.Pixels[0].PixelUrl.indexOf("mmSiteId=") > -1 && req.body.Pixels[0].PixelUrl.indexOf("attributeName=") > -1 && req.body.Pixels[0].PixelUrl.indexOf("attributeValue=") > -1) {

		var mmSiteId = req.body.Pixels[0].PixelUrl.split("mmSiteId=")[1].split("&")[0];
		var maxymiser_visitor_id = req.body.Pixels[0].PartnerUuid;
		var dmp_delivery_id = req.body.Pixels[0].CampaignId;
		var attributeName = req.body.Pixels[0].PixelUrl.split("attributeName=")[1].split("&")[0];
		var attributeValue = req.body.Pixels[0].PixelUrl.split("attributeValue=")[1].split("&")[0];

	} else {
		res.status(400) // error handling
		let message = {
			status: "FAIL",
			message: "Data Missing from Payload",
			mmSiteId: mmSiteId
		};
		res.json(message);

		ServerLogger.send(message,"Visitor Service"); // Send message to Log Server

	}

	// If Valid request	: Check Token	
	var tokenResponse = await Visitor.tokenRefresh(mmSiteId, Visitor.AUTH_SERVICE_DOMAIN);

	// Make MM call if token available
	if (tokenResponse.token) {

		var mmDispatchResponse = await Visitor.mmDispatch(mmSiteId, tokenResponse.token, maxymiser_visitor_id, dmp_delivery_id,attributeName,attributeValue);

		// Return Success Message if MM call successful
		if (mmDispatchResponse.status === "FAIL") { res.status(400); } // error handling
		res.json(mmDispatchResponse);

		ServerLogger.send(mmDispatchResponse,"Visitor Service"); // Send message to Log Server

	} else {

		// Report Error
		Logger("DEV REQUIRED : Report Error", 1);
		res.status(400) // error handling

		res.json(tokenResponse);

		ServerLogger.send(tokenResponse,"Visitor Service"); // Send message to Log Server

	}
	//*/
});

// PORT LISTENER
app.listen(PORT, function () {

	Logger("Listening on port : " + PORT, 1);

});