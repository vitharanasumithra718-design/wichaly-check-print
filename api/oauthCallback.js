// api/oauthCallback.js
const { ACCOUNTS_URL, CLIENT_ID, CLIENT_SECRET, saveTokens } = require("./zohoAuth");
const url = require("url");

module.exports = async function handler(req, res) {
  const query = req.query || url.parse(req.url, true).query || {};
  const code = query.code;

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Missing authorization code</h2><p>Please try <a href='/api/oauthStart'>authorizing again</a>.</p>");
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:8888";
  const protocol = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/api/oauthCallback`;

  const accountsServer = (query["accounts-server"] || ACCOUNTS_URL).replace(/\/+$/, "");
  const tokenUrl = `${accountsServer}/oauth/v2/token`;

  const params = new URLSearchParams({
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  try {
    const apiRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await apiRes.json();

    if (!data.refresh_token) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html>
<html>
<head>
  <title>Zoho Connection</title>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
    .card { background:#1e293b; border: 1px solid #ef4444; border-radius:16px; padding:30px; max-width:540px; text-align:center; }
    h2 { color:#f87171; margin-top:0; }
    pre { background:#0f172a; padding:12px; border-radius:8px; text-align:left; font-size:13px; color:#fca5a5; overflow-x:auto; }
    a.btn { display:inline-block; background:#0284c7; color:#fff; padding:10px 22px; border-radius:8px; text-decoration:none; font-weight:600; margin-top:14px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Error Connecting to Zoho</h2>
    <p>The authorization code was expired or already used.</p>
    <pre>${JSON.stringify(data, null, 2)}</pre>
    <a class="btn" href="/api/oauthStart">🔄 Click Here to Try Again</a>
  </div>
</body>
</html>`);
      return;
    }

    data.expires_at = Date.now() + (data.expires_in || 3600) * 1000;
    saveTokens(data);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html>
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
</html>`);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>Token Exchange Network Error</h2><pre>${err.message}</pre><p><a href="/api/oauthStart">Try again</a></p>`);
  }
};
