// api/oauthStart.js
const { ACCOUNTS_URL, CLIENT_ID } = require("./zohoAuth");
const url = require("url");

module.exports = async function handler(req, res) {
  const query = req.query || url.parse(req.url, true).query || {};
  const host = req.headers.host || "localhost:8888";
  const protocol = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
  
  const defaultRedirect = `${protocol}://${host}/api/oauthCallback`;
  const redirectUri = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/oauthCallback`
    : (process.env.URL ? `${process.env.URL}/api/oauthCallback` : defaultRedirect);

  const clientId = query.client_id || CLIENT_ID;

  if (!clientId) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h3>Error: Client ID is missing</h3><p>Please enter your Client ID in the app settings or environment variables.</p>`);
    return;
  }

  const authUrl =
    `${ACCOUNTS_URL}/oauth/v2/auth?` +
    `scope=ZohoBooks.fullaccess.all&` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.writeHead(302, { Location: authUrl });
  res.end();
};
