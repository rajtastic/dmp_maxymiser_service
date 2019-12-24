// Environment.js

// FUNCTION : Environment
const Environment = function () {

	// Check environment : start
	for (var i = 0; i < process.argv.length; i++) {

		if (process.argv[i].indexOf("=") > 1) {
			var environment = process.argv[i].split("=")[1];
		}

	}

	if (typeof environment === "undefined") {
		var environment = "production";
	}

	return environment

}

module.exports = Environment;
