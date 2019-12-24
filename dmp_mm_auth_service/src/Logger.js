// Logger.js

const Environment = require('./Environment');

// FUNCTION : Logger
const Logger = function (message, msg_verb) {
		
	if (typeof log_verbose !== "undefined") {

		if (typeof msg_verb !== "number") {

			console.log("No Message Verbosity Declare:")
			console.log(message);

		} else if (log_verbose === 3) {

			if (msg_verb >= 3)

				console.log(message +  " [p" + msg_verb + "]");

		} else if (log_verbose === 2) {

			if (msg_verb >= 2) {

				console.log(message +  " [p" + msg_verb + "]");

			}

		} else if (log_verbose === 1) {

			if (msg_verb >= 1) {

				console.log(message +  " [p" + msg_verb + "]");

			}

		} else if (log_verbose === 0) {

			console.log(message +  " [p" + msg_verb + "]");

		}

	}

}

module.exports = Logger;