#!/usr/bin/env node
// Google Search Console (Search Analytics API) wrapper — headless, zero deps.
// Uses a SERVICE ACCOUNT (not interactive OAuth) so it runs in a cron/cloud agent:
// it mints an RS256 JWT with Node's built-in crypto, exchanges it for an access
// token, and queries the Search Analytics API. Grant the service account
// "read" access to the GSC property first.
//
// Env:
//   GSC_SERVICE_ACCOUNT_JSON  path to the service-account JSON key file (or inline JSON)
//   GSC_SITE_URL              the GSC property, e.g. "https://elevatecareerhub.com/"
//                             or domain property "sc-domain:elevatecareerhub.com"
//
// Usage:
//   node seo/tools/gsc.mjs queries [days]   # top queries (default 28 days)
//   node seo/tools/gsc.mjs pages   [days]   # top pages

import crypto from "node:crypto";
import fs from "node:fs";

const KEY = process.env.GSC_SERVICE_ACCOUNT_JSON;
const SITE = process.env.GSC_SITE_URL;
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

function requireConfig() {
  if (!KEY || !SITE) {
    console.error(
      "[gsc] Missing config. Set GSC_SERVICE_ACCOUNT_JSON (key file path or inline JSON)\n" +
        "and GSC_SITE_URL (the property). See seo/tools/README.md and .env.example."
    );
    process.exit(1);
  }
}

function loadServiceAccount() {
  const raw = KEY.trim().startsWith("{") ? KEY : fs.readFileSync(KEY, "utf8");
  return JSON.parse(raw);
}

const b64url = (input) =>
  Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = signer.sign(sa.private_key).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const assertion = `${header}.${claim}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    console.error(`[gsc] Token exchange failed: HTTP ${res.status}`);
    process.exit(1);
  }
  return (await res.json()).access_token;
}

function dateRange(days) {
  const d = new Date();
  const end = new Date(d.getTime() - 2 * 86400000); // GSC data lags ~2 days
  const start = new Date(end.getTime() - days * 86400000);
  const iso = (x) => x.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

async function query(dimension, days) {
  requireConfig();
  const sa = loadServiceAccount();
  const token = await getAccessToken(sa);
  const { startDate, endDate } = dateRange(days);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate, dimensions: [dimension], rowLimit: 100 }),
  });
  if (!res.ok) {
    console.error(`[gsc] Query failed: HTTP ${res.status} — ${await res.text()}`);
    process.exit(1);
  }
  const data = await res.json();
  return {
    range: { startDate, endDate },
    rows: (data.rows || []).map((r) => ({
      key: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    })),
  };
}

const [cmd, daysArg] = process.argv.slice(2);
const days = Number(daysArg) || 28;
const dimension = cmd === "pages" ? "page" : cmd === "queries" ? "query" : null;
if (!dimension) {
  console.error("Usage: gsc.mjs <queries|pages> [days]");
  process.exit(1);
}
query(dimension, days).then((out) => console.log(JSON.stringify(out, null, 2)));
