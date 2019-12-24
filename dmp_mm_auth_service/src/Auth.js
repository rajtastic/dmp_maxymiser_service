// auth_service.js

const connectDb = require("./connection");
const mmSiteIdModel = require("./mmSiteId.model");
const Logger = require('./Logger');
const ServerLogger = require('./ServerLogger');
const request = require('request-promise');
require('request-debug')(request);

const Auth = {};

// CONFIG : Set Maxymiser Auth Endpoint
Auth.mm_auth_endpoint = (process.env.MM_AUTH_ENDPOINT) ? process.env.MM_AUTH_ENDPOINT : "https://api-auth-eu.maxymiser.com/oauth2/v1/tokens";
//Auth.mm_auth_endpoint = (process.env.MM_AUTH_ENDPOINT) ? process.env.MM_AUTH_ENDPOINT : "https://mm-auth-endpoint.free.beeceptor.com?test=true";

// FUNCTION : Token Checker
Auth.tokenCheck = async function (mmSiteId) {

	Logger("Auth.tokenCheck(" + mmSiteId + ") : Called", 2);
	var mmSiteId = await mmSiteIdModel.find({ "mmSiteId": mmSiteId });

	if (mmSiteId[0] && mmSiteId[0].auth && mmSiteId[0].auth.expires && mmSiteId[0].auth.expires_date) {

		// Expiry Date Found
		var return_message = {
			status: "OK",
			message: "See expires",
			expires: mmSiteId[0].auth.expires,
			expires_date:mmSiteId[0].auth.expires_date,
			username: mmSiteId[0].auth.username,
			password: mmSiteId[0].auth.password,
			token: mmSiteId[0].auth.token,
			client_id: mmSiteId[0].auth.client_id,
			client_base64string: mmSiteId[0].auth.client_base64string,
			mmSiteId: mmSiteId
		};

	} else {

		// No site ID
		var return_message = {
			status: "FAIL",
			message: "Auth error : Cannot find site ID in DB",
			mmSiteId: mmSiteId

		};

	}

	return return_message;

}
// FUNCTION : Maxymiser Token Grab
Auth.mmTokenGrab = async function (mmSiteId, username, password, client_base64string) {

	Logger("Auth.mmTokenGrab(" + mmSiteId + "," + username + "," + password + "," + client_base64string + ") : Called", 2);

	var mm_auth_endpoint = Auth.mm_auth_endpoint;

	Logger("DEV REQUIRED : MM OAuth Token Grab : Sending bad auth responses", 1);

	// Grab MM Creds
	var response = await request({
		method: "POST",
		uri: mm_auth_endpoint,
		json: true,
		form :  {"username" : username, "password" : password, "grant_type" : "password"},
		headers: {
			"Authorization": "Basic " + client_base64string,
			"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
		}
	}).then(function (response_data) {

		 // Check if 'message_object' is in JSON format
		 if(typeof response_data !== "object"){			
			return {
				status: "FAIL",
				message: "Maxymiser Call has failed - Maxymiser Auth Response not in JSON format"				
			}
		}

		// Check for valid responses
		var error_messages = [];
		if (typeof response_data.expires_in === "number") {
			var expiry_date = Date.now() + (response_data.expires_in * 1000);
		} else {
			error_messages.push("Token Expiry not a number or not available");
		}

		// Check for 'access token'
		if (!response_data.access_token) {
			error_messages.push("No 'access_token' in response");
		}

		// Check for 'token_type'
		if (!response_data.token_type) {
			error_messages.push("No 'token_type' in response");
		}

		// Return if no errors
		if (error_messages.length === 0) {

			return {
				status: "OK",
				message: "Maxymiser Credentials Valid",
				token: response_data.access_token,
				expires: expiry_date,
				expires_date: new Date(expiry_date)
			}

		} else {

			// Else return error
			return {
				status: "FAIL",
				message: "Maxymiser Call has failed - see 'error'",
				error: error_messages.join("\n")
			}

		}

	}).catch(function (err) {
		
		return {
			status: "FAIL",
			message: "Maxymiser Call has failed - see 'error'",
			error:err
		}
	})

	// MM Creds Valid : Interim code : UPDATE THIS TO USE ABOVE CREDS HANDLING
	Logger("Auth.mmTokenGrab(" + mmSiteId + "," + username + "," + password + "," + client_base64string + ") : Response received from Maxymiser", 2);	
	return response;

}


// FUNCTION : Token Set
Auth.tokenSet = async function (mmSiteId, username, password, client_id, client_base64string) {

	Logger("Auth.tokenSet(" + mmSiteId + "," + username + "," + password + "," + client_id + "," + client_base64string + ") : Called", 2);

	// Check MM Credentials/grab token
	Logger("DEV REQUIRED : MM OAuth Token Grab : Build", 1);
	var mm_token_data = await Auth.mmTokenGrab(mmSiteId, username, password, client_base64string);
	
	// If error getting credentials
	if (mm_token_data && !mm_token_data.token || !mm_token_data.expires || !mm_token_data.expires_date) {

		return mm_token_data; // return back response from MM service

	}

	// Set Data
	var data = {
		mmSiteId: mmSiteId,
		auth: {
			username: username,
			password: password,
			token: mm_token_data.token,
			expires: mm_token_data.expires,
			expires_date:mm_token_data.expires_date,
			client_id: client_id,
			client_base64string: client_base64string
		}
	}

	// Set filter
	var filter = {
		mmSiteId: mmSiteId
	};

	// Set options
	var options = {
		new: true,
		upsert: true,
		setDefaultsOnInsert: true
	};

	// Callback
	var recordReturn = function (error, doc) {

		// Grab token if it exists in the record
		if (doc && doc.auth && doc.auth.token) {
			token = doc.auth.token;
		} else { token = false; }

	}

	// RE-WRITTEN BELOW await mmSiteIdModel.findOneAndUpdate(filter, data, options, recordReturn).then(() => Logger("Auth.tokenSet(" + mmSiteId + "," + username + "," + password + ") : Created/Updated site Credentials in DB", 2));
	siteUpsert = await mmSiteIdModel.findOneAndUpdate(filter, data, options, recordReturn);
	Logger("Auth.tokenSet(" + mmSiteId + "," + username + "," + password + "," + client_id + "," + client_base64string + ") : Created/Updated site Credentials in DB", 2)

	// Grab Token
	var token = false;
	if (siteUpsert && siteUpsert.auth && siteUpsert.auth.token) {
		token = siteUpsert.auth.token;
	}

	// Return Message
	if (token) {
		var returnMessage = {
			status: "OK",
			message: "Credentials Set/Updated : Token Available and stored",
			token:token,
			mmSiteId: mmSiteId
		}
	} else {
		var returnMessage = {
			status: "FAIL",
			message: "Something Went Wrong - No Token Available",
			mmSiteId: mmSiteId

		}
	}
	return returnMessage;
}

// FUNCTION : Token Refresh
Auth.tokenRefresh = async function (mmSiteId) {

	Logger("Auth.tokenRefresh(" + mmSiteId + ") : Called", 2);
	var token_message = await Auth.tokenCheck(mmSiteId);
	var token_expired = false;

	// Check if token expired
	if (typeof token_message.expires == "number") {

		// If expired, mark it down
		if (token_message.expires - Date.now() < 3000) {
			var token_expired = true;
		}

		// If no token available : fail out now
	} else {

		return token_message;
	}

	// If expired, get new token
	record = false;

	if (token_expired) {

		Logger("Auth.tokenRefresh(" + mmSiteId + ") : Token Needs Refreshing", 2);
		record = await Auth.tokenSet(mmSiteId, token_message.username, token_message.password, token_message.client_id, token_message.client_base64string);

	} else {

		// Otherwise, grab the existing token
		record = { token: token_message.token };
	}
	
	// Return message
	if (record && record.token) {
		var returnMessage = {
			status: "OK",
			message: "token returned",
			token: record.token,
			mmSiteId: mmSiteId

		}
	} else {
		var returnMessage = {
			status: "Fail",
			message: "No token available for some reason",
			mmSiteId: mmSiteId,

		}

	}

	return returnMessage;

}

// FUNCTION : Credentials Delete
Auth.tokenDelete = async function (mmSiteId, username, password, client_base64string) {

	Logger("Auth.tokenDelete(" + mmSiteId + "," + username + "," + password + "," + client_base64string + ") : Called", 2);

	// Check Creds
	var credsValidate = await Auth.mmTokenGrab(mmSiteId, username, password, client_base64string);

	// If Invalid Creds : Return back message
	if (credsValidate && !credsValidate.token) {

		return credsValidate; // return back response from MM service

	}

	// Otherwise, try to delete creds and return message		
	var dbDeleteResult = await mmSiteIdModel.deleteOne({ mmSiteId: mmSiteId }, function (err) {
		if (err) return {
			status: "Fail",
			dbResponse: err
		};
	});

	// Return Errors
	if (dbDeleteResult.status) {
		return dbDeleteResult;
	}

	// Otherwise, return back result	
	Logger("Auth.tokenDelete(" + mmSiteId + "," + username + "," + password + "," + client_base64string + ") : Successfully Deleted", 2);

	return {
		status: "OK",
		message: "Any credentials against this site have been deleted",
		dbResponse: dbDeleteResult

	}
}

// FUNCTION : Token Grab
Auth.credCheck = async function (mmSiteId) {

	Logger("Auth.credCheck(" + mmSiteId + ") : Called", 2);

	// Check Creds
	var record;

	// Set filter
	var filter = {
		mmSiteId: mmSiteId
	};

	// RE-WRITTEN BELOW await mmSiteIdModel.findOneAndUpdate(filter, data, options, recordReturn).then(() => Logger("Auth.tokenSet(" + mmSiteId + "," + username + "," + password + ") : Created/Updated site Credentials in DB", 2));
	record = await mmSiteIdModel.find(filter, null, null);


	// Return Message
	if (record && record.length > 0) {
		var returnMessage = {
			status: "OK",
			message: "Record Found : ID = " + record[0].id,
			mmSiteId: mmSiteId,
		}
	} else {
		var returnMessage = {
			status: "FAIL",
			message: "No Creds Found",
			mmSiteId: mmSiteId

		}
	}
	return returnMessage;
}

module.exports = Auth;