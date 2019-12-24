// User.model.js
const mongoose = require("mongoose");

const mmSiteIdSchema = new mongoose.Schema({
	mmSiteId: {type: String,required:true,unique:true},
	auth: {
		username: {type: String,required:true},
		password: {type: String,required:true},
		token: {type: String},
		expires: {type: Number},
		expires_date:{type:String},
		client_id: {type: String},
		client_base64string: {type: String}
	}
});

const mmSiteIdModel = mongoose.model("mmSiteId", mmSiteIdSchema);
module.exports = mmSiteIdModel;