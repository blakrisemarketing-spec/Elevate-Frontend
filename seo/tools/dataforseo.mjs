#!/usr/bin/env node
// DataForSEO REST wrapper — headless, API-key auth, zero dependencies.
// Reads DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD from the environment and Basic-auths
// the v3 REST API directly, so it runs in a cron/cloud agent with no interactive
// login. Output is JSON on stdout for the nightly/weekly routine to parse.
//
// Usage:
//   node seo/tools/dataforseo.mjs serp   "cv writing service Ghana"   # live Google SERP (Ghana)
//   node seo/tools/dataforseo.mjs volume "cv writing,scholarship abroad" # monthly search volume
//   node seo/tools/dataforseo.mjs ideas  "how to study abroad"        # related keyword ideas
//
// Location defaults to Ghana (location_code 2288), language English. Override with
// DFS_LOCATION_CODE / DFS_LANGUAGE_CODE env vars (e.g. set 2826 for the UK diaspora).

const LOGIN = process.env.DATAFORSEO_LOGIN;
const PASSWORD = process.env.DATAFORSEO_PASSWORD;
const LOCATION_CODE = Number(process.env.DFS_LOCATION_CODE || 2288); // Ghana
const LANGUAGE_CODE = process.env.DFS_LANGUAGE_CODE || "en";
const BASE = "https://api.dataforseo.com/v3";

function requireCreds() {
  if (!LOGIN || !PASSWORD) {
    console.error(
      "[dataforseo] Missing credentials. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.\n" +
        "See seo/tools/README.md and .env.example."
    );
    process.exit(1);
  }
}

async function post(endpoint, task) {
  requireCreds();
  const auth = Buffer.from(`${LOGIN}:${PASSWORD}`).toString("base64");
  const res = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([task]),
  });
  if (!res.ok) {
    console.error(`[dataforseo] HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  return res.json();
}

async function serp(keyword) {
  const data = await post("/serp/google/organic/live/advanced", {
    keyword,
    location_code: LOCATION_CODE,
    language_code: LANGUAGE_CODE,
    depth: 20,
  });
  const items = data?.tasks?.[0]?.result?.[0]?.items || [];
  const organic = items
    .filter((i) => i.type === "organic")
    .map((i) => ({ rank: i.rank_absolute, title: i.title, url: i.url, domain: i.domain }));
  return { keyword, location_code: LOCATION_CODE, organic };
}

async function volume(keywords) {
  const data = await post("/keywords_data/google_ads/search_volume/live", {
    keywords,
    location_code: LOCATION_CODE,
    language_code: LANGUAGE_CODE,
  });
  const result = data?.tasks?.[0]?.result || [];
  return result.map((r) => ({
    keyword: r.keyword,
    search_volume: r.search_volume,
    competition: r.competition,
    cpc: r.cpc,
  }));
}

async function ideas(seed) {
  const data = await post("/dataforseo_labs/google/related_keywords/live", {
    keyword: seed,
    location_code: LOCATION_CODE,
    language_code: LANGUAGE_CODE,
    limit: 50,
  });
  const items = data?.tasks?.[0]?.result?.[0]?.items || [];
  return items.map((i) => ({
    keyword: i.keyword_data?.keyword,
    search_volume: i.keyword_data?.keyword_info?.search_volume,
  }));
}

const [cmd, arg] = process.argv.slice(2);
const run = async () => {
  switch (cmd) {
    case "serp":
      return serp(arg);
    case "volume":
      return volume(arg.split(",").map((s) => s.trim()).filter(Boolean));
    case "ideas":
      return ideas(arg);
    default:
      console.error("Usage: dataforseo.mjs <serp|volume|ideas> \"<query>\"");
      process.exit(1);
  }
};
run().then((out) => console.log(JSON.stringify(out, null, 2)));
