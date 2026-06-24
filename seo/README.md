# SEO / GEO Control Plane

This directory is the **control plane** for Elevate Career Hub's SEO & GEO program.
It is the source of truth that the nightly automation reads and writes, so the work
is deterministic, resumable, and auditable through git history.

## Goal

Rank Elevate Career Hub #1 on Google Search and in AI chatbots (ChatGPT,
Perplexity, Google AI Overviews, Bing Copilot) for relevant career, CV, scholarship,
and study-abroad keywords (Ghana-first, diaspora-aware).

## How it works

```
seo/
  roadmap.yml      # ordered, prioritized content/technical backlog (the "what")
  progress.json    # machine cursor: what's done, last run, open PRs (the "where we are")
  playbook.md      # the nightly procedure in plain English (the "how")
  briefs/          # per-article content briefs (target query, angle, outline)
  reports/         # baseline + weekly analytics/rank/GEO reports
  offsite/         # off-site authority queue (directories, PR angles, outreach)
  tools/           # headless data wrappers (DataForSEO, GSC, Bing) — env-key auth
```

The nightly routine (`.claude/skills/seo-nightly/`) reads `roadmap.yml`, picks the
first `status: todo` item, executes it (usually: publish one article), flips it to
`done`, advances `progress.json`, and opens a PR for human review. The weekly routine
(`.claude/skills/seo-weekly/`) measures rankings and re-aims the roadmap.

## Single source of truth

New content is added by appending **one object** to the `BLOG_POSTS` array in
`src/priority/data/blog.ts`. Everything else, the `/<slug>/` route, the prerendered
zero-JS HTML, the Article + BreadcrumbList JSON-LD (`og:type=article`), the
`sitemap.xml` entry, and the `/blog/` index card, is derived automatically at build
time (`scripts/build-priority-routes.mjs`). Build artifacts (`dist/`, `sitemap.xml`)
are **never committed**; Hostinger regenerates them on every deploy.

## Brand-voice + accuracy gate (this brand's safety gate)

Elevate is a founder-led brand whose credibility is the product. Before any article
PR opens it must pass:

- **`ech-brand-voice`** — the "Insider Friend" tone, the approved CTAs, the canonical
  stats (6+ years, 96% positive reviews, 2,000+ professionals helped), and **no em
  dashes anywhere** (founder directive, stripped site-wide).
- **`ech-content-audit`** — page-level compliance.
- **`stop-slop`** — strip AI phrasing tells while keeping numbers, lists, and honest
  caveats.
- **No fabrication.** Never invent a testimonial or attach a name to a quote you do
  not have, never invent a price or service inclusion (match `ech-service-catalog` /
  `src/checkout/catalog.ts`), and never promise an outcome the brand does not control
  (final admission and scholarship funding decisions sit with the providers).

## Data tools (require credentials)

The `tools/*.mjs` wrappers use API-key / service-account auth so they run headless
(no interactive login). They read secrets from environment variables only, never
commit keys. See `.env.example` and `tools/README.md`. Until credentials are
configured, the content pipeline still runs fully; only live rank/traffic data is
gated.

## Deployment reality (read before touching the build)

- The build is **npm, not pnpm** (Hostinger's corepack crashes on pnpm).
- Content routes are **zero-JS static SSG**. Never add hydration to an article.
- Static assets are cached one year, and **images are not fingerprinted**, so a
  swapped image needs a new filename. See `elevate-deployment` and
  `elevate-design-system` for the full detail.
