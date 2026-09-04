// netlify/functions/zohoAuth.js
// Shared Zoho OAuth helper for Wycherley International School Cheque & Voucher Printer
const fs = require("fs");
const path = require("path");

const TOKENS_PATH = path.join(process.cwd(), "tokens.json");

const CLIENT_ID     = process.env.ZOHO_CLIENT_ID     || "1000.O5OO0M4Z233JXWHBH3BF3H54SMCXMH";
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "c0f0e1f99eab52812b969b02d7164ac9bc86825d95";
const DEFAULT_ORG_ID = "933829154";
let envOrgId = process.env.ZOHO_ORG_ID;
if (envOrgId && (envOrgId.includes("9187") || envOrgId === "918798701")) envOrgId = null;
const ORG_ID = envOrgId || DEFAULT_ORG_ID; // Wycherley International School

const ACCOUNTS_URL = "https://accounts.zoho.com";
const API_URL      = "https://www.zohoapis.com/books/v3";
const DEFAULT_REFRESH_TOKEN = "1000.57ec42130e16850f433c0cee72156ca5.dca11e286f4157cd23e8eaf34cefd236";

let cachedToken          = null;
let cachedTokenExpiresAt = 0;

function getStoredTokens(customRefreshToken) {
  let rt = (customRefreshToken && String(customRefreshToken).trim());
  if (!rt || rt.length < 20) {
    let envRt = process.env.ZOHO_REFRESH_TOKEN;
    if (envRt && !envRt.includes("stale") && envRt.length > 20 && !envRt.includes("1000.9187")) {
      rt = envRt;
    } else {
      rt = DEFAULT_REFRESH_TOKEN;
    }
  }
  return {
    refresh_token: rt,
    access_token:  process.env.ZOHO_ACCESS_TOKEN || "",
    expires_at:    parseInt(process.env.ZOHO_EXPIRES_AT || "0", 10),
  };
}

function saveTokens(tokens) {
  cachedToken          = tokens.access_token;
  cachedTokenExpiresAt = tokens.expires_at;
  try {
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
  } catch (_) {}
}

async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  const cId = clientId || CLIENT_ID;
  const cSec = clientSecret || CLIENT_SECRET;
  const url = `${ACCOUNTS_URL}/oauth/v2/token?refresh_token=${refreshToken}&client_id=${cId}&client_secret=${cSec}&grant_type=refresh_token`;
  const res  = await fetch(url, { method: "POST" });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Failed to refresh Zoho token: " + JSON.stringify(data));
  }
  const tokens = getStoredTokens(refreshToken) || {};
  tokens.refresh_token = refreshToken;
  tokens.access_token = data.access_token;
  tokens.expires_at   = Date.now() + (data.expires_in || 3600) * 1000;
  saveTokens(tokens);
  return data.access_token;
}

async function getAccessToken(customRefreshToken) {
  if (!customRefreshToken && cachedToken && cachedTokenExpiresAt && Date.now() < cachedTokenExpiresAt - 60000) {
    return cachedToken;
  }

  const tokens = getStoredTokens(customRefreshToken);
  if (!tokens || !tokens.refresh_token) {
    const err = new Error("NOT_AUTHORIZED");
    err.code = "NOT_AUTHORIZED";
    throw err;
  }

  if (tokens.access_token && tokens.expires_at && Date.now() < tokens.expires_at - 60000) {
    cachedToken          = tokens.access_token;
    cachedTokenExpiresAt = tokens.expires_at;
    return tokens.access_token;
  }

  return await refreshAccessToken(tokens.refresh_token);
}

async function apiRequest(method, endpoint, body, orgId, customRefreshToken) {
  const accessToken = await getAccessToken(customRefreshToken);
  const organizationId = orgId || ORG_ID;
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${API_URL}${endpoint}${separator}organization_id=${organizationId}`;
  const options = {
    method,
    headers: {
      Authorization:  `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res  = await fetch(url, options);
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch (_) { parsed = text; }
  return { status: res.status, data: parsed };
}

module.exports = {
  getAccessToken,
  apiRequest,
  saveTokens,
  getStoredTokens,
  CLIENT_ID,
  CLIENT_SECRET,
  ORG_ID,
  ACCOUNTS_URL,
  API_URL,
  TOKENS_PATH,
};
