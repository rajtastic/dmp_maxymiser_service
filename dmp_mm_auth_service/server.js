// server.js

// REQUIRES
require("./src/config"); // config file

const Environment = require('./src/Environment');
const Logger = require('./src/Logger');
const ServerLogger = require('./src/ServerLogger');
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const connectDb = require("./src/connection");
const mmSiteIdModel = require("./src/mmSiteId.model");
const Auth = require("./src/Auth");

app.use(bodyParser.json())
app.set('view engine', 'pug')

//TEMP : IP
var ip = require("ip");


// Auto Config
if (Environment() !== "dev") { global.log_verbose = 4 };

// Notes
Logger("DEV REQUIRED : MM OAuth Token Grab : Build", 1);
Logger("DEV REQUIRED : MongoDB : Set server URL in image automatically", 1);
Logger("DEV REQUIRED : MongoDB : Set set up server for MongoDB", 1);
Logger("Environment=" + Environment(), 1);

// ROUTES

// HEALTHCHECK
app.get("/health", (req, res) => {
	Logger("ENDPOINT : /health : endpoint called", 2);

	let message = "DMP MM Visitor Auth Service is healthy";
	res.send(message);
	ServerLogger.send(message,"Auth Service")

});

// AUTH IFRAME
app.get("/auth", (req, res) => {
	Logger("ENDPOINT : /auth : endpoint called", 2);
	res.render('auth_form', { title: 'DMP > Maxymiser Authorisation' });	


});

// DELETE CREDENTIALS
app.post("/token_delete", async (req, res) => {

	Logger("ENDPOINT : /token_delete : endpoint called", 2);
	
	if (req.body && req.body.mmSiteId && req.body.auth && req.body.auth.username && req.body.auth.password && req.body.auth.client_id && req.body.auth.client_secret) {

		var mmSiteId = req.body.mmSiteId;
		var username = req.body.auth.username;
		var password = req.body.auth.password;
		var client_id = req.body.auth.client_id;
		var client_secret = req.body.auth.client_secret;

		// Create Auth Base64 String
		let data = client_id + ":" + client_secret; 
		let buff = new Buffer.from(data);
		var client_base64string = buff.toString('base64');

	} else {

		res.status(400); // error handling

		let message = {
			status: "FAIL",
			message: "Missing/Invalid Payload"
		}		
		res.json(message);
		
		ServerLogger.send(message,"Auth Service"); // Send message to Log Server

	}

	// If Valid request	: Create record and return
	let message = await Auth.tokenDelete(mmSiteId, username, password,client_base64string);

	if (message.status === "FAIL") { res.status(400); } // error handling
	res.json(message);
	
	ServerLogger.send(message,"Auth Service")

});

// TOKEN REFRESH
app.get("/token_refresh/:id", async (req, res) => {

	Logger("ENDPOINT : /token_refresh/:id : endpoint called", 2);

	// Syntax Check : Site ID?
	if (req.params.id) {
		mmSiteId = req.params.id;
	} else {
		res.status(400);
		let message = {
			status: "FAIL",
			message: "No/Invalid Site ID specified"
		}
		res.json(message);

		ServerLogger.send(message,"Auth Service"); // Send message to Log Server
	}

	// Token Refresh	
	let message = await Auth.tokenRefresh(mmSiteId);

	if (message.status === "FAIL") { res.status(400); } // error handling
	
	res.json(message); 

	ServerLogger.send(message,"Auth Service"); // Send message to Log Server

});

// SET/UPDATE CREDENTIALS
app.post("/site-set", async (req, res) => {

	Logger("ENDPOINT : /site-set : endpoint called", 2);

	// Syntax Check
	if (req.body) {
		if (req.body.mmSiteId && req.body.auth && req.body.auth.username && req.body.auth.password && req.body.auth.client_id && req.body.auth.client_secret) {

			var mmSiteId = req.body.mmSiteId;
			var username = req.body.auth.username;
			var password = req.body.auth.password;
			var client_id = req.body.auth.client_id;
			var client_secret = req.body.auth.client_secret;

			// Create Auth Base64 String
			let data = client_id + ":" + client_secret; 
			let buff = new Buffer.from(data);
			var client_base64string = buff.toString('base64');

		} else {
			res.status(400);

			let message = {
				status: "FAIL",
				message: "Missing/Invalid Payload"
			}
			res.json(message);

			ServerLogger.send(message,"Auth Service"); // Send message to Log Server
		}
	} else {
		res.status(400);

		let message = {
			status: "FAIL",
			message: "Missing/Invalid Payload"
		}
		res.json(message);

		ServerLogger.send(message,"Auth Service"); // Send message to Log Server
	}

	// If Valid request	: Create record and return
	let message = await Auth.tokenSet(mmSiteId, username, password,client_id,client_base64string);
	if (message.status === "FAIL") { res.status(400); }

	res.json(message);

	ServerLogger.send(message,"Auth Service"); // Send message to Log Server

});

// GRAB CREDS
app.get("/check/:id", async (req, res) => {

	Logger("ENDPOINT : /check : endpoint called", 2);

	// Syntax Check : Site ID?
	if (req.params.id) {
		mmSiteId = req.params.id;
	} else {
		res.status(400);

		let message = {
			status: "FAIL",
			message: "No/Invalid Site ID specified"
		}
		res.json(message);

		ServerLogger.send(message,"Auth Service"); // Send message to Log Server
	}

	// If Valid request	: Create record and return
	let message = await Auth.credCheck(mmSiteId);

	if (message.status === "FAIL") { res.status(400); } // error handling
	res.json(message);

	ServerLogger.send(message,"Auth Service"); // Send message to Log Server

});

// STATIC FILES
app.use(express.static(__dirname + '/public'));

// PORT LISTENER
app.listen(PORT, function () {

	Logger("Listening on port : " + PORT, 1);

	connectDb().then(() => {

		Logger("MongoDb connected", 1);

	});
});