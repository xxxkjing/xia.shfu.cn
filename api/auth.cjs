const { createVercelBegin, createVercelComplete } = require("simple-oauth2");

const oauth2 = createVercelBegin({
	provider: "github",
	clientId: process.env.OAUTH_CLIENT_ID,
	clientSecret: process.env.OAUTH_CLIENT_SECRET,
	redirectUri: `${process.env.VERCEL_URL}/api/callback`
});

module.exports = oauth2;
