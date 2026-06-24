#!/usr/bin/env node
// Bing Webmaster Tools API wrapper — headless, API-key auth, zero deps.
// Bing's index also feeds ChatGPT and Copilot, so this is a GEO signal too.
//
// Env:
//   BING_API_KEY    your Bing Webmaster API key
//   BING_SITE_URL   the verified site, e.g. "https://elevatecareerhub.com/"
//
// Usage:
//   node seo/tools/bing.mjs queries   # GetQueryStats (impressions/clicks/position)
//   node seo/tools/bing.mjs traffic   # GetRankAndTrafficStats
//   node seo/tools/bing.mjs <Method>  # any GET Bing Webmaster API method

const KEY = process.env.BING_API_KEY;
const SITE = process.env.BING_SITE_URL;
const BASE = "https://ssl.bing.com/webmaster/api.svc/json";

function requireConfig() {
  if (!KEY || !SITE) {
    console.error(
      "[bing] Missing config. Set BING_API_KEY and BING_SITE_URL.\n" +
        "See seo/tools/README.md and .env.example."
    );
    process.exit(1);
  }
}

async function call(method) {
  requireConfig();
  const url = `${BASE}/${method}?siteUrl=${encodeURIComponent(SITE)}&apikey=${encodeURIComponent(KEY)}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[bing] HTTP ${res.status} ${res.statusText} on ${method}`);
    process.exit(1);
  }
  return res.json();
}

const [cmd] = process.argv.slice(2);
const method =
  cmd === "queries" ? "GetQueryStats" : cmd === "traffic" ? "GetRankAndTrafficStats" : cmd;
if (!method) {
  console.error("Usage: bing.mjs <queries|traffic|MethodName>");
  process.exit(1);
}
call(method).then((out) => console.log(JSON.stringify(out, null, 2)));
