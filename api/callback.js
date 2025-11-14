const { createVercelComplete } = require("simple-oauth2");

const oauth2 = createVercelComplete({
	provider: "github",
	clientId: process.env.OAUTH_CLIENT_ID,
	clientSecret: process.env.OAUTH_CLIENT_SECRET
});

module.exports = oauth2;
