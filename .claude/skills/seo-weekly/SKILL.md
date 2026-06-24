---
name: seo-weekly
description: >
  Run the Elevate Career Hub weekly SEO analytics + re-prioritization pass. Use this
  for the weekly routine, a rank/traffic review, or when asked to "run the weekly SEO
  analytics", "pull GSC and rank data", "check our rankings", "re-prioritize the SEO
  roadmap", or "do the SEO maintenance pass". Pulls Google Search Console, DataForSEO,
  and Bing data, checks AI-citation presence, computes week-over-week movement,
  re-prioritizes seo/roadmap.yml, writes a dated report, and opens a PR for review.
  Elevate-specific, NOT BetterHealth.
---

# SEO Weekly Analytics Routine

This is the measurement-and-steering half of the SEO program. The nightly routine
*produces* content; this weekly pass *measures* what's working and *re-aims* the
roadmap at it. One run = one report + roadmap update, shipped as a PR for review.

## Hard rules

1. **PR for review only.** Never commit to `main`. Open a PR; a human merges.
2. **Secrets from env only.** The data tools read credentials from environment
   variables (DATAFORSEO_*, GSC_*, BING_*). Never put secrets in the repo.
3. **Degrade gracefully.** If a data source's credentials are absent, its tool exits
   with a message. Skip that source and note it in the report; do not fail the run.
4. **Accuracy over narrative.** Report the numbers as they are. If data is thin or a
   source errored, say so plainly.

## Procedure

### 1. Sync and branch
- Fetch latest `main`; create branch `seo/weekly-YYYY-MM-DD`.

### 2. Pull the data (skip any source whose creds are missing)
- **Google Search Console** (the site has a WordPress history at the same domain, so
  expect real rows once the property is connected):
  - `node seo/tools/gsc.mjs queries 28` — top queries (clicks, impressions, CTR, position).
  - `node seo/tools/gsc.mjs pages 28` — top pages.
- **DataForSEO** — current Ghana SERP position for each PUBLISHED article's primary
  keyword (read them from `seo/roadmap.yml` `status: done` items and the live posts
  in `src/priority/data/blog.ts`):
  - `node seo/tools/dataforseo.mjs serp "<keyword>"` and record where
    `elevatecareerhub.com` ranks (or "not in top 20").
  - Optionally refresh `node seo/tools/dataforseo.mjs volume "<keywords>"` for roadmap
    items, many were seeded with `volume: null` and need real numbers.
- **Bing Webmaster** (optional): `node seo/tools/bing.mjs queries` — skip if no creds.

### 3. AI-citation (GEO) check
- For 3 to 5 priority queries (e.g. "professional CV writing Ghana", "scholarships
  for Ghanaians to study abroad", "how to get a scholarship for masters"), use web
  search to check whether `elevatecareerhub.com` appears in Google's results / AI
  Overviews and whether AI answers cite it. Record a simple present / not-yet per
  query. This is the GEO scoreboard over time.

### 4. Analyze
- **Week-over-week movement:** read the previous `seo/reports/weekly-*.md` and compute
  deltas in position / clicks / impressions for tracked keywords and pages.
- **Quick wins from GSC:** queries where the site already gets impressions but sits at
  position ~5 to 20 (page 2) or has low CTR. These are the cheapest ranking gains,
  flag them for a new article or an on-page improvement to an existing one.
- **Gaps:** high-impression GSC queries the site is NOT yet targeting, propose new
  roadmap items.

### 5. Re-prioritize the roadmap
- Update `seo/roadmap.yml`: reorder `status: todo` items toward what the data shows is
  winnable now, retarget keywords where GSC/DataForSEO reveal a stronger term, fill in
  the `volume` fields that were seeded `null`, and add new items for the gaps found in
  step 4. Never reorder `done` items.

### 6. Write the report
- `seo/reports/weekly-YYYY-Www.md`: top GSC queries + pages, current SERP positions
  for target keywords, week-over-week deltas, the GEO citation scoreboard, the quick
  wins and gaps identified, and the roadmap changes made this week.

### 7. Open the PR
- Update `seo/progress.json` (`lastWeeklyRun`). Commit and open a PR titled
  `SEO weekly: <YYYY-Www>` with the report file + roadmap changes.
  Use a plain commit message. Do not add a Co-Authored-By trailer or any
  AI-attribution footer.

### 8. Deliver the report in the chat (do NOT email)
- Present the **complete report as your final message** of this run. The user reads
  the weekly report directly in the Claude app / routine run (and its completion
  notification), not by email. Put the PR link at the top, then the full report:
  GSC top queries + pages, current SERP positions for the target keywords,
  week-over-week movement, the GEO citation scoreboard, the quick wins and gaps, and
  the roadmap changes you made. Keep it readable as a chat message (headings + short
  tables), not a file dump.

## Notes
- No `npm run build` is needed unless this pass edits files under `src/` (it usually
  only touches `seo/`). If it does edit `src/`, build and verify as the nightly skill
  does, and keep the no-em-dash + zero-JS rules.
- This pass does not publish articles. It hands the nightly routine a sharper,
  data-driven queue.
