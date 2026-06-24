---
name: seo-nightly
description: >
  Execute one cycle of the Elevate Career Hub SEO/GEO program. Use this when
  running the nightly content routine, a scheduled SEO run, or when asked to
  "publish the next SEO article", "run the nightly SEO job", "do the next item on
  the SEO roadmap", or "advance the SEO program". Reads seo/roadmap.yml +
  seo/progress.json, executes the next todo item (usually publishing one
  career/study-abroad article), verifies the zero-JS SSG build, and opens a PR for
  review. Composes the seo-* skills and enforces the brand-voice + accuracy gate.
  Ghana-first and diaspora-aware. Elevate-specific, NOT BetterHealth.
---

# SEO Nightly Routine

You are advancing Elevate Career Hub toward #1 rankings on Google and AI chatbots
for career, CV, scholarship, and study-abroad keywords (Ghana-first, diaspora-aware).
One invocation = one unit of progress, shipped as a reviewable PR. Be rigorous: this
is a founder-led brand whose credibility is the product, and every change is public.

Read `seo/playbook.md` and `seo/README.md` first, they are the source of truth.
This skill is the executable checklist.

## Hard rules (never break)

1. **PR for review only.** Never commit to `main`. Open a PR; a human merges.
2. **Brand-voice + accuracy gate.** Every article passes the `ech-brand-voice`
   ("Insider Friend") discipline before the PR opens. **No em dashes anywhere**
   (founder directive, stripped site-wide). **Never fabricate** a testimonial,
   attach a real person's name to a quote you don't have, invent a price/service
   inclusion, or promise an outcome the brand does not control. For study-abroad
   and scholarship content, keep the honest caveat: final admission and funding
   decisions sit with the universities and providers. Use the canonical facts, do
   not regress them: **6+ years**, **96% positive reviews**, **2,000+
   professionals helped**. Any price or service claim must match
   `ech-service-catalog` / `src/checkout/catalog.ts`.
3. **Build must pass offline, and stay zero-JS.** `npm run build` cannot depend on
   any API, and a blog article ships **zero client JS** (it is static SSG). Never
   add hydration to a content page.
4. **Single source of truth.** A new article = **one object appended to
   `BLOG_POSTS` in `src/priority/data/blog.ts`**. That array IS the index and the
   route registry; the `/blog/` card, the `/<slug>/` page, the prerendered HTML,
   the Article + BreadcrumbList JSON-LD, and the `sitemap.xml` entry all derive
   from it at build time (`scripts/build-priority-routes.mjs`). Never hand-edit
   `dist/`, `sitemap.xml`, the JSON-LD, or `src/priority/registry.ts` for content.
5. **Build is npm, not pnpm.** Hostinger's corepack crashes on pnpm. Use `npm`.
6. **No secrets in the repo.** Tools read env vars only.

## Procedure

### 1. Sync and branch
- `git fetch origin && git switch -c seo/nightly-$(date +%Y-%m-%d) origin/main`
  (if the branch exists, append a short suffix). Work from latest `main` to keep
  the PR conflict-free.

### 2. Select the task
- Read `seo/progress.json` and `seo/roadmap.yml`.
- Pick the **first** `items` entry with `status: todo`. That is tonight's task.
- If none are `todo`, run the **maintenance pass** (see below) instead.

### 3. Refine the target (skip gracefully if creds absent)
- If DataForSEO creds are set: `node seo/tools/dataforseo.mjs volume "<keyword>"`
  and `... ideas "<keyword>"` to confirm volume and find secondary terms + real
  "questions people ask" for the FAQ-style section.
- If GSC creds are set: `node seo/tools/gsc.mjs queries 28` to see what the site is
  already surfacing for, and prioritize accordingly.
- Each tool exits cleanly with a message if its env vars are missing, never let
  that block the run. The content pipeline runs fully without any credentials.

### 4. Brief, then draft
- Write `seo/briefs/<slug>.md`: primary + secondary keywords, intent, the angle, an
  H2 outline, the internal links to include, and the one-sentence citable claim each
  H2 will open with.
- Append one object to `BLOG_POSTS` in `src/priority/data/blog.ts`, matching the
  shape of the existing posts (the CV-writing post is a good reference). The fields:
  - `route` (e.g. `/your-slug/`, trailing slash) and `slug` (no slashes). Keep the
    slug human-readable and keyword-bearing. The route renders at the root, so the
    page is `/<slug>/`, and the build emits `dist/<slug>/index.html`.
  - `title` (the on-page H1 and, with `, Elevate Career Hub` auto-appended, the
    `<title>`), `category`, `date` (e.g. `18 May 2026`), `readMinutes`,
    `cover` (one of the `BlogCoverKey` motifs: `network` | `cv` | `scholarship` |
    `toolkit`), and `excerpt` (this becomes the meta description AND the blog-card
    teaser, so write it to be both, and humanise it).
  - `body`: an array of typed blocks. Only three types exist: `{ type: 'p', text }`,
    `{ type: 'h', text }` (an H2), and `{ type: 'ul', items: string[] }`. There is
    no callout/quote/image/link block in this model, keep it to clean prose,
    headings, and lists.
  - **Citability for AI engines:** open each `h` section's first `p` with a
    self-contained claim sentence an AI engine can lift as a standalone answer.
  - **Internal links** are done as inline prose, not link blocks: weave 2 to 3
    natural references to related articles and to the money pages
    (`/career-services/`, `/educational-services/`, `/diy-products/`,
    `/get-into-grad-school-bootcamp/`, or `/contact-us/`) into the body. Close with
    the approved CTA framing: "Book a free chat" / "Tell us the goal and we'll map
    the path."
  - Ghana-first and diaspora-aware framing where it adds value (local job market,
    scholarships for Ghanaians, rebuilding a career as an immigrant in the
    UK/US/Canada, the co-founders' real paths: Manchester full-ride, fintech via a
    cold outreach to a CEO).
  - Use the `seo-content` and `seo-content-brief` skills for quality; `seo-schema`
    is automatic via `build-priority-routes.mjs` (Article + BreadcrumbList derive
    themselves, with `og:type=article`).
- **Images are optional in this model.** The blog body has no image block, and all
  posts share the site OG image. If you do add an article asset (e.g. a new cover
  motif), remember Elevate's cache rule: images are NOT fingerprinted, so a swapped
  asset must get a NEW filename or the 1-year `.htaccess` cache serves the old one.

### 5. Brand-voice + accuracy gate
- Run `ech-brand-voice` against the new article: Insider Friend tone, named the
  unspoken problem, concrete over abstract, honest not hypey, approved CTA, and the
  canonical stats intact. Then run `ech-content-audit` for page-level compliance.
- Run `stop-slop` to strip AI phrasing tells. Keep numbers, lists, and honest
  caveats; remove throat-clearing openers, "not X, it's Y" reversals, and empty
  adverbs.
- Resolve every flag, or stop and leave the item `in_progress` with a note. Do not
  ship copy that fabricates a testimonial, a price, or a guarantee.

### 6. Build and verify
- `npm ci` if `node_modules` is missing, then `npm run build`.
- Confirm:
  - `dist/<slug>/index.html` exists with `<title>` ending `, Elevate Career Hub`,
    `og:type=article`, the right canonical, and Article + BreadcrumbList JSON-LD in
    the `@graph`.
  - `dist/sitemap.xml` includes `https://elevatecareerhub.com/<slug>/`.
  - The new `/blog/` index card renders (the array entry is picked up).
  - The page ships zero client JS (no `<script src>` beyond what every page has;
    a blog post has no checkout island).
- Em-dash check: `grep -n " — " src/priority/data/blog.ts` returns nothing for your
  new block (zero spaced em dashes in prose). Also scan the `excerpt` and `title`,
  the two most visible fields, on their own line for tells.

### 7. Advance state
- Flip the roadmap item to `status: done` and add `completed: <YYYY-MM-DD>`.
- Update `seo/progress.json`: `lastRunDate`, append the id to `completed[]`,
  increment `publishedCount`, set a `notes` pointer to the next todo.

### 8. Open the PR
- Commit (`SEO: <article title>`), push, and open a PR with `gh pr create`.
- PR body: target keyword + intent, schema added, internal links added, and the
  build-verification output (the head tags + that sitemap includes the route).
- Use a plain commit message. Do not add a Co-Authored-By trailer or any
  AI-attribution footer.

## Maintenance pass (weekly, or when no todo content items remain)

- **Analytics & rank pulse:** pull GSC + DataForSEO + Bing; write
  `seo/reports/<YYYY>-W<ww>.md` with rank deltas for roadmap keywords and a GEO
  citation check (query ChatGPT / Perplexity / AI Overviews / Copilot for target
  terms; note whether Elevate is cited). Re-prioritize `roadmap.yml`. The dedicated
  `seo-weekly` skill is the full version of this pass.
- **Technical hygiene:** refresh aging articles (bump `date`), validate schema,
  confirm internal links resolve, review the 3G load budget (`npm run bench -- /`).
  Use `seo-audit`, `seo-technical`, `seo-geo`, `seo-drift`.
- **Off-site queue:** research and append concrete, live targets to
  `seo/offsite/directory-targets.md` and angles to `digital-pr-angles.md`.

## Scaling levers (when asked to go faster / be comprehensive)

- **Generate `dist/llms.txt`** (roadmap id `tech-llms-txt`): Elevate generates
  `sitemap.xml` but not yet an `llms.txt`. Add it to `build-priority-routes.mjs`
  next to the sitemap writer. This is a direct GEO win for AI crawlers.
- **Add `link-internal` + `faq` blocks to the blog model** (roadmap id
  `tech-blog-link-faq-blocks`): extend `BlogBlock` in `src/priority/data/blog.ts`
  and the `BlogPost` template so articles can carry a structured internal-link graph
  and a FAQPage schema block (answer-first), the way the money pages already do.
- **Per-article OG images** (`tech-og-images-blog`) with `seo-image-gen`, remember
  the non-fingerprinted-asset filename rule.
- **Programmatic service/location pages** seeded from `ech-service-catalog`, same
  data-driven SSG mechanism as the blog (one data file + the existing templates).
