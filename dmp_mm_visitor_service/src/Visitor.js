// visitor_service.js

require('request');
const Environment = require('./Environment');
const Logger = require('./Logger');
const ServerLogger = require('./ServerLogger');
const request = require('request-promise');
//require('request-debug')(request);

const Visitor = {};

// CONFIG : Auth Service Config
Visitor.AUTH_SERVICE_DOMAIN_dev = "http://localhost:8081";
Visitor.AUTH_SERVICE_DOMAIN_prod = (process.env.AUTH_SERVICE_DOMAIN) ? process.env.AUTH_SERVICE_DOMAIN : "http://localhost:8081";

// CONFIG : MM_VISITOR_API
Visitor.MM_VISITOR_API = (process.env.MM_VISITOR_API) ? process.env.MM_VISITOR_API : "https://api-data-eu.maxymiser.com";
//Visitor.MM_VISITOR_API = (process.env.MM_VISITOR_API) ? process.env.MM_VISITOR_API : "https://mm-visitor-api-endpoint.free.beeceptor.com";

// Env Switch
Visitor.AUTH_SERVICE_DOMAIN = (Environment() === "dev") ? Visitor.AUTH_SERVICE_DOMAIN_dev : Visitor.AUTH_SERVICE_DOMAIN_prod;

// FUNCTION : Token Refresh
Visitor.tokenRefresh = async function (mmSiteId) {

    Logger("Visitor.tokenRefresh(" + mmSiteId + ") : Called", 2);


    var response = await request({
        method: "GET",
        uri: Visitor.AUTH_SERVICE_DOMAIN + "/token_refresh/" + mmSiteId
    }).then(function (res) {

        return JSON.parse(res);

    }).catch(function (err) {

        var return_message;
        if (err.response && err.response.body) {

            
            try {
                return_message = JSON.parse(err.response.body);
            } catch (e) {

                return_message = err.response.body;

            }
            
        } else {

            return_message = err;
        }
        return return_message;
    });

    return response;

}

// FUNCTION : Maxymiser Dispatch
Visitor.mmDispatch = async function (mmSiteId, token, maxymiser_visitor_id, dmp_delivery_id,attributeName,attributeValue) {

    Logger("Visitor.mmDispatch(" + mmSiteId + "," + maxymiser_visitor_id + "," + dmp_delivery_id + "," + attributeName + "," + attributeValue+ ") : Called", 2);

    // Make Payload    
    var payload_body = {}
    payload_body[attributeName] = attributeValue;

    // Send Request to MM    
    var response = await request({
        method: "PUT",
        uri: Visitor.MM_VISITOR_API + "/api/v1/sites/" + mmSiteId + "/customer-profiles/" + maxymiser_visitor_id, //api-data-eu.maxymiser.com
        json: true,
        body: payload_body,
        headers: {
            "Authorization": "Bearer " + token,
            "Accept-Encoding": "gzip",
            "Content-Type": "application/json"
        }
    }).then(function (res) {

        // Check if response is in JSON format
        try{
            var message = JSON.parse(res);
        }
        catch(error){
            var message = res;
        }

        return {
            status: "OK",
            message: message,
            site_id: mmSiteId,            
            maxymiser_visitor_id: maxymiser_visitor_id,
            dmp_delivery_id: dmp_delivery_id            
        }

    }).catch(function (err) {
        return {
            status: "FAIL",
            message: "Maxymiser Call has failed - see 'error'",
            error: err,
            site_id: mmSiteId,
            token: token,
            maxymiser_visitor_id: maxymiser_visitor_id,
            dmp_delivery_id: dmp_delivery_id            
        }
    })

    return response;

}

module.exports = Visitor;