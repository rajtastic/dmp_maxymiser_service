// FUNCTION : Grab Credentials
window.auth_clear = function () {

    jQuery("#mmSiteId").val("");
    jQuery("#username").val("");
    jQuery("#pw").val("");
    jQuery("#pw2").val("");
    jQuery("#client_id").val("");
    jQuery("#client_secret").val("");
}

// FUNCTION : Grab Credentials
window.auth_grab = function () {

    var mmSiteId = jQuery("#mmSiteId").val();
    var username = jQuery("#username").val();
    var password = jQuery("#pw").val();
    var passwordconfirm = jQuery("#pw2").val();
    var client_id = jQuery("#client_id").val();
    var client_secret = jQuery("#client_secret").val();

    return {
        mmSiteId: mmSiteId,
        username: username,
        password: password,
        passwordconfirm: passwordconfirm,
        client_id:client_id,
        client_secret:client_secret
    }
}

// FUNCTION : Check Credentials
window.auth_validate = function () {

    var creds = auth_grab();

    // Trigger fail if missing field
    if (!creds.mmSiteId || !creds.username || !creds.password || !creds.passwordconfirm || !creds.client_id || !creds.client_secret) {

        if (!creds.mmSiteId) { var notification = alertify.notify('site ID Missing ', 'error', 3); }
        if (!creds.username) { var notification = alertify.notify('Username Missing ', 'error', 3); }
        if (!creds.password) { var notification = alertify.notify('Password Missing ', 'error', 3); }
        if (!creds.passwordconfirm) { var notification = alertify.notify('Confirm Password Missing ', 'error', 3); }
        if (!creds.client_id) { var notification = alertify.notify('Client ID Missing ', 'error', 3); }
        if (!creds.client_secret) { var notification = alertify.notify('Client Secret Missing ', 'error', 3); }
        return "fail";
    }

    // Check Passwords Match
    if (creds.password !== creds.passwordconfirm) {
        var notification = alertify.notify('Passwords Do Not Match - please re-enter', 'error', 3);
        return "fail";
    }
    return {
        mmSiteId: creds.mmSiteId,
        username: creds.username,
        password: creds.password,
        client_id:creds.client_id,
        client_secret:creds.client_secret
    }
}

// FUNCTION : Submit Credentials
window.auth_submit = function () {

    var auth = auth_validate();

    // Return if failed
    if (auth === "fail") {
        return;
    }

    // Submit Form and wait for response
    var endpoint_url = (document.location.port) ? "//" + document.domain + ":" + document.location.port : "//" + document.domain;
    endpoint_url += "/site-set";

    var data = {
        mmSiteId: auth.mmSiteId,
        auth: {
            username: auth.username,
            password: auth.password,
            client_id:auth.client_id,
            client_secret:auth.client_secret
        }
    }

    jQuery.ajax({
        type: "POST", // GET/POST/PUT ETC
        url: endpoint_url,
        data: JSON.stringify(data),
        dataType: "json",
        contentType: "application/json"

    }).done(function (response) {

        // Success        
        auth_clear();
        alertify.notify(response.message + "\n" + "site ID=" + response.mmSiteId, 'success', 3);

    }).fail(function (err) {

        // Fail

        // ADD ERROR DETAILS		
        var message;
        
        // Handle Message
        if(err.responseJSON && err.responseJSON.message){message = err.responseJSON.message} else{
            message = err.responseText;            
        }

        // Handle Error
        if(err.responseJSON && err.responseJSON.error){error_message = err.responseJSON.error} else{
            error_message = "No error details provided";
        }
        
        // Handle JSON message
        if(typeof error_message === "object"){
            alertify.notify(message + "\n" + "see console for details", 'error', 3);
            console.log("LOG | FAIL | " + message + " see console for error details");
            console.log(error_message);
             
        } else {
    
            console.log("LOG | FAIL | " + message + error_message);
            alertify.notify(message + "\n" + error_message, 'error', 3);
        }

    });

};

// FUNCTION : Delete Credentials
window.auth_delete = function () {

    var auth = auth_validate();

    // Return if failed
    if (auth === "fail") {
        return;
    }

    // Submit Form and wait for response
    var endpoint_url = (document.location.port) ? "//" + document.domain + ":" + document.location.port : "//" + document.domain;
    endpoint_url += "/token_delete";

    var data = {
        mmSiteId: auth.mmSiteId,
        auth: {
            username: auth.username,
            password: auth.password,
            client_id:auth.client_id,
            client_secret:auth.client_secret
        }
    }

    jQuery.ajax({
        type: "POST", // GET/POST/PUT ETC
        url: endpoint_url,
        data: JSON.stringify(data),
        dataType: "json",
        contentType: "application/json"

    }).done(function (response) {

        // Success        
        auth_clear();
        alertify.notify(response.message, 'success', 3);

    }).fail(function (err) {

        // Fail

        // ADD ERROR DETAILS		
        var message;
        
        // Handle Message
        if(err.responseJSON && err.responseJSON.message){message = err.responseJSON.message} else{
            message = err.responseText;            
        }

        // Handle Error
        if(err.responseJSON && err.responseJSON.error){error_message = err.responseJSON.error} else{
            error_message = "No error details provided";
        }

        // Handle JSON message
        if(typeof error_message === "object"){
            alertify.notify(message + "\n" + "see console for details", 'error', 3);
            console.log("LOG | FAIL | " + message + " see console for error details");
            console.log(error_message);
             
        } else {
    
            console.log("LOG | FAIL | " + message + error_message);
            alertify.notify(message + "\n" + error_message, 'error', 3);
        }

    });


};
