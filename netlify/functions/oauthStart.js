// netlify/functions/oauthStart.js
const { ACCOUNTS_URL, CLIENT_ID } = require("./zohoAuth");

exports.handler = async function (event) {
  const host = event.headers.host || "localhost:8888";
  const protocol = event.headers["x-forwarded-proto"] || "http";
  const defaultRedirect = `${protocol}://${host}/.netlify/functions/oauthCallback`;
  const redirectUri = process.env.URL
    ? `${process.env.URL}/.netlify/functions/oauthCallback`
    : defaultRedirect;

  const clientId = (event.queryStringParameters && event.queryStringParameters.client_id) || CLIENT_ID;

  if (!clientId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `<h3>Error: Client ID is missing</h3><p>Please enter your Client ID in the app settings or environment variables.</p>`,
    };
  }

  const authUrl =
    `${ACCOUNTS_URL}/oauth/v2/auth?` +
    `scope=ZohoBooks.fullaccess.all&` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  return {
    statusCode: 302,
    headers: { Location: authUrl },
    body: "",
  };
};
