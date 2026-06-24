# SEO Data Tools

Headless wrappers the nightly/weekly routine uses to pull live SEO data. All three use
**API-key / service-account auth** (no interactive login) so they run in a cron or
cloud agent. They read credentials from **environment variables only**, never commit
keys. Each prints a clear message and exits non-zero if its credentials are missing,
so the build/content pipeline keeps working without them.

These require Node 18+ (`fetch` is built in). The repo targets Node 20.

## dataforseo.mjs (paid)

```bash
node seo/tools/dataforseo.mjs serp   "cv writing service Ghana"
node seo/tools/dataforseo.mjs volume "cv writing,scholarship abroad,statement of purpose"
node seo/tools/dataforseo.mjs ideas  "how to study abroad from Ghana"
```

Env: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`. Optional: `DFS_LOCATION_CODE`
(default 2288 = Ghana; use 2826 for the UK, 2840 for the US to gauge diaspora terms),
`DFS_LANGUAGE_CODE` (default `en`).

## gsc.mjs (free)

```bash
node seo/tools/gsc.mjs queries 28   # top queries, last 28 days
node seo/tools/gsc.mjs pages   28   # top pages
```

Env: `GSC_SERVICE_ACCOUNT_JSON` (path to the service-account key file, or inline
JSON), `GSC_SITE_URL` (the property, e.g. `https://elevatecareerhub.com/` or
`sc-domain:elevatecareerhub.com`).

**Setup:** In Google Cloud, create a service account and a JSON key. Enable the
"Google Search Console API". In Search Console → Settings → Users and permissions,
add the service account's `client_email` as a user with at least "Restricted"
(read) access on the property. The domain has a WordPress history at the same URL, so
expect real rows once the property is connected.

## bing.mjs (free)

```bash
node seo/tools/bing.mjs queries
node seo/tools/bing.mjs traffic
```

Env: `BING_API_KEY`, `BING_SITE_URL`.

**Setup:** Verify the site in Bing Webmaster Tools, then Settings → API Access →
generate an API key.

## Where secrets live

For local/manual runs, put them in a git-ignored `.env.local` (see `.env.example`)
and export them, e.g. `set -a; source .env.local; set +a`. For the scheduled cloud
agent, configure them as the cron environment's secrets. Never place real keys in the
repo. These SEO keys are read-only analytics credentials and are unrelated to the
Paystack/Tosend runtime secrets the PHP layer uses.
