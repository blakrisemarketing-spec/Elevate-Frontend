# Nightly SEO/GEO Playbook

This is the human-readable specification of what the nightly routine does. The
executable version lives in `.claude/skills/seo-nightly/SKILL.md`, which the
scheduled cloud agent invokes. Keep the two in sync.

## Invariants (never violate)

1. **PR for review.** Every change ships as a pull request. Nothing is committed to
   `main` directly. A human merges.
2. **Brand-voice + accuracy gate.** Any content passes the `ech-brand-voice` and
   `ech-content-audit` disciplines before the PR opens. No em dashes anywhere
   (founder directive). Never fabricate a testimonial, a price, a service inclusion,
   or an outcome the brand does not control (final admission/funding sits with the
   providers). Keep the canonical stats: 6+ years, 96% positive reviews, 2,000+
   professionals helped. Wrong or invented claims are worse than a delayed article.
3. **Build must pass offline, and stay zero-JS.** `npm run build` must succeed without
   any API, and an article ships zero client JS (static SSG). The data tools inform
   *what* to write; they are never a build dependency.
4. **Single source of truth.** A new article = one object appended to `BLOG_POSTS` in
   `src/priority/data/blog.ts`. Never hand-edit `dist/`, `sitemap.xml`, the JSON-LD,
   or `src/priority/registry.ts` for content.
5. **npm, not pnpm. No secrets in the repo.** Tools read credentials from env only.

## Nightly procedure

1. **Sync.** Fetch `origin/main`; create branch `seo/nightly-YYYY-MM-DD`.
2. **Select task.** Read `seo/progress.json` and `seo/roadmap.yml`. Pick the first
   item with `status: todo`. If none, run a maintenance pass instead (see below).
3. **Refine target (if creds available).** Use `seo/tools/dataforseo.mjs` and
   `seo/tools/gsc.mjs` to confirm the keyword still has volume / no better variant,
   and to pull "questions people ask". Skip gracefully if creds are absent.
4. **Brief.** Write/update `seo/briefs/<slug>.md`: primary + secondary keywords,
   search intent, the angle, an H2 outline, the internal links to include, and the
   citable claim each H2 should open with.
5. **Draft.** Append one object to `BLOG_POSTS` in `src/priority/data/blog.ts`
   following the existing article shape. Requirements:
   - Each `h` section's first `p` opens with a self-contained claim sentence
     (passage-level citability for AI engines).
   - Body uses only the supported blocks: `p`, `h` (an H2), and `ul`.
   - Weave 2 to 3 internal links as inline prose to related articles and to the money
     pages (`/career-services/`, `/educational-services/`, `/diy-products/`,
     `/get-into-grad-school-bootcamp/`, `/contact-us/`). Close with the approved CTA.
   - `excerpt` doubles as the meta description and the blog-card teaser; write it for
     both and humanise it.
   - Ghana-first and diaspora-aware framing where relevant (local job market,
     scholarships for Ghanaians, rebuilding a career abroad, the co-founders' paths).
6. **Brand-voice + accuracy gate.** Run `ech-brand-voice`, `ech-content-audit`, and
   `stop-slop`. Fix or stop if anything is off-brand, fabricated, or em-dashed.
7. **Build & verify.** `npm run build`. Confirm:
   - `dist/<slug>/index.html` exists with the right `<title>` (ends `, Elevate Career
     Hub`), `og:type=article`, canonical, and Article + BreadcrumbList JSON-LD.
   - `dist/sitemap.xml` includes the new route.
   - The article ships zero client JS, and the file has zero spaced em dashes.
8. **Update state.** Flip the roadmap item to `status: done` with `completed` date;
   bump `seo/progress.json` (`lastRunDate`, `completed[]`, `publishedCount`).
9. **PR.** Commit and open a PR titled `SEO: <article title>` summarizing the target
   keyword, the schema added, and the verification output. Plain commit message, no
   AI-attribution footer.

## Maintenance pass (when no `todo` content items remain, or on the weekly run)

- **Analytics & rank pulse:** pull GSC + DataForSEO + Bing; write
  `seo/reports/YYYY-Www.md` with rank deltas for tracked keywords and GEO citation
  checks (is Elevate cited by AI engines for target queries?). Re-prioritize
  `roadmap.yml` based on what's gaining traction. The `seo-weekly` skill is the full
  version of this pass.
- **Technical hygiene:** refresh aging articles, check internal links resolve,
  validate schema, and watch the 3G load budget (`npm run bench -- /`).
- **Off-site queue:** top up `seo/offsite/` with directory targets and PR angles for
  human action.

## Cadence

| Routine | Schedule | Entry point |
|---|---|---|
| Content engine | Nightly | publish 1 item from `roadmap.yml` |
| Analytics & rank pulse | Weekly (Mon) | `seo-weekly` → report |
| Off-site authority | Weekly | top up `seo/offsite/` |
| Technical audit & drift | Monthly | full `seo-audit` + `seo-drift` |
