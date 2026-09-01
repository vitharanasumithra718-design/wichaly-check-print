// api/zohoAuth.js
// Shared Zoho OAuth helper for Wycherley International School Cheque & Voucher Printer
const fs = require("fs");
const path = require("path");

const TOKENS_PATH = process.env.VERCEL ? "/tmp/tokens.json" : path.join(process.cwd(), "tokens.json");

const DEFAULT_CLIENT_ID     = "1000.O5OO0M4Z233JXWHBH3BF3H54SMCXMH";
const DEFAULT_CLIENT_SECRET = "c0f0e1f99eab52812b969b02d7164ac9bc86825d95";
const DEFAULT_ORG_ID        = "933829154"; // Wycherley International School

let envClientId = process.env.ZOHO_CLIENT_ID;
if (envClientId && envClientId.includes("CUHQ")) envClientId = null; // Filter stale old org env
const CLIENT_ID = envClientId || DEFAULT_CLIENT_ID;

let envClientSecret = process.env.ZOHO_CLIENT_SECRET;
if (envClientSecret && envClientSecret.includes("636078052")) envClientSecret = null; // Filter stale old org env
const CLIENT_SECRET = envClientSecret || DEFAULT_CLIENT_SECRET;

let envOrgId = process.env.ZOHO_ORG_ID;
if (envOrgId && (envOrgId.includes("9187") || envOrgId === "918798701")) envOrgId = null; // Filter stale old org env
const ORG_ID = envOrgId || DEFAULT_ORG_ID;

const ACCOUNTS_URL = "https://accounts.zoho.com";
const API_URL      = "https://www.zohoapis.com/books/v3";

let cachedToken          = null;
let cachedTokenExpiresAt = 0;

function getStoredTokens() {
  const rt = process.env.ZOHO_REFRESH_TOKEN;
  if (rt) {
    return {
      refresh_token: rt,
      access_token:  process.env.ZOHO_ACCESS_TOKEN || "",
      expires_at:    parseInt(process.env.ZOHO_EXPIRES_AT || "0", 10),
    };
  }
  try {
    if (fs.existsSync(TOKENS_PATH)) {
      return JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
    }
  } catch (_) {}
  return null;
}

function saveTokens(tokens) {
  cachedToken          = tokens.access_token;
  cachedTokenExpiresAt = tokens.expires_at;
  if (!process.env.ZOHO_REFRESH_TOKEN) {
    try {
      fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
    } catch (_) {}
  }
}

async function refreshAccessToken(refreshToken, clientId, clientSecret, accountsServer) {
  const cId = clientId || CLIENT_ID;
  const cSec = clientSecret || CLIENT_SECRET;
  const baseAccounts = accountsServer || ACCOUNTS_URL;
  const url = `${baseAccounts}/oauth/v2/token?refresh_token=${refreshToken}&client_id=${cId}&client_secret=${cSec}&grant_type=refresh_token`;
  const res  = await fetch(url, { method: "POST" });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Failed to refresh Zoho token: " + JSON.stringify(data));
  }
  const tokens = getStoredTokens() || {};
  tokens.access_token = data.access_token;
  tokens.expires_at   = Date.now() + (data.expires_in || 3600) * 1000;
  saveTokens(tokens);
  return data.access_token;
}

async function getAccessToken() {
  if (cachedToken && cachedTokenExpiresAt && Date.now() < cachedTokenExpiresAt - 60000) {
    return cachedToken;
  }

  const tokens = getStoredTokens();
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

async function apiRequest(method, endpoint, body, orgId) {
  const accessToken = await getAccessToken();
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
