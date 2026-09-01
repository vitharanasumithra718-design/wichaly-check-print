// netlify/functions/oauthCallback.js
const { ACCOUNTS_URL, CLIENT_ID, CLIENT_SECRET, saveTokens } = require("./zohoAuth");

exports.handler = async function (event) {
  const code = (event.queryStringParameters || {}).code;
  if (!code) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: "<h2>Missing authorization code</h2><p>Please try <a href='/.netlify/functions/oauthStart'>authorizing again</a>.</p>",
    };
  }

  const host = event.headers.host || "localhost:8888";
  const protocol = event.headers["x-forwarded-proto"] || "http";
  const defaultRedirect = `${protocol}://${host}/.netlify/functions/oauthCallback`;
  const redirectUri = process.env.URL
    ? `${process.env.URL}/.netlify/functions/oauthCallback`
    : defaultRedirect;

  const url =
    `${ACCOUNTS_URL}/oauth/v2/token?` +
    `code=${encodeURIComponent(code)}&` +
    `client_id=${encodeURIComponent(CLIENT_ID)}&` +
    `client_secret=${encodeURIComponent(CLIENT_SECRET)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `grant_type=authorization_code`;

  const res  = await fetch(url, { method: "POST" });
  const data = await res.json();

  if (!data.refresh_token) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `<h2>Error getting tokens</h2><pre>${JSON.stringify(data, null, 2)}</pre>
             <p><a href="/.netlify/functions/oauthStart">Try again</a></p>`,
    };
  }

  data.expires_at = Date.now() + (data.expires_in || 3600) * 1000;
  saveTokens(data);

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<!DOCTYPE html>
<html>
<head>
  <title>Zoho Connection Successful</title>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
    .card { background:#1e293b; border: 1px solid #334155; border-radius:16px; padding:40px; max-width:540px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,.5); }
    h2 { color:#38bdf8; margin-top:0; font-size:22px; }
    p { color:#94a3b8; line-height:1.6; font-size:14px; }
    a.btn { display:inline-block; background:#0284c7; color:#fff; padding:12px 28px; border-radius:10px; text-decoration:none; font-weight:600; margin-top:20px; transition:0.2s; }
    a.btn:hover { background:#0369a1; }
    .token-box { background:#0f172a; border:1px solid #334155; border-radius:8px; padding:16px; margin:20px 0; text-align:left; }
    .token-box label { font-size:12px; font-weight:700; color:#38bdf8; display:block; margin-bottom:6px; text-transform:uppercase; }
    .token-box code { font-family:monospace; font-size:13px; color:#e2e8f0; word-break:break-all; display:block; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:48px; margin-bottom:12px;">✅</div>
    <h2>Zoho Books Connected Successfully!</h2>
    <p>Your <strong>Wycherley International School</strong> Zoho Books organization is now connected to the Cheque & Voucher Printer.</p>
    <div class="token-box">
      <label>ZOHO_REFRESH_TOKEN</label>
      <code id="rt">${data.refresh_token}</code>
    </div>
    <a class="btn" href="/">← Go to Cheque Printer App</a>
  </div>
  <script>
    if (window.opener) {
      setTimeout(() => {
        window.opener.postMessage({ type: 'ZOHO_AUTH_SUCCESS' }, '*');
        window.close();
      }, 1500);
    }
  </script>
</body>
</html>`,
  };
};
