// connection.js
const Environment = require('./Environment');
const Logger = require('./Logger');
const mongoose = require("mongoose");
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
const SiteID = require("./mmSiteId.model");

// DB Config
var db_connection_dev = (process.env.DB_DOMAIN) ? process.env.DB_DOMAIN : "mongodb://localhost:27017/dmp_mm_auth_doc";
var db_connection_prod = (process.env.DB_DOMAIN) ? process.env.DB_DOMAIN : "mongodb://mongo:27017/dmp_mm_auth_doc";

// Env Switch
db_connection = (Environment() === "dev") ? db_connection_dev : db_connection_prod;

const connectDb = () => {
	Logger("Mongodb_connection=" + db_connection,1)
	return mongoose.connect(db_connection);
};
module.exports = connectDb;