# Route Migration Plan — 24 WordPress-snapshot routes → redesigned SSG

**Status: ✅ Phases 0–4 COMPLETE.** All 24 content routes are migrated to data-driven zero-JS SSG (LCP ~0.3–0.4s on 3G; smoke 35/35; audit green). Templates: `ProductDetail`, `ServiceDetail`, `BlogIndex`/`BlogPost`, plus bespoke `JobReadinessBootcamp`/`JrbThankYou`/`LetsKeepInTouch`/`Faqs`. Content lives in `src/priority/data/{products,services,blog}.ts`.

**Phase 5 (optional cleanup) — NOT done, low-risk follow-up:** every content route now renders a priority component, so the WordPress-snapshot SPA (`src/main.tsx`), the `public/snapshots/*.html` files, the `vendor-css.css` bundle, and the snapshot-generation half of `scripts/build-wordpress-html.mjs` are **no longer used for any route** and can be removed wholesale. Deferred because it's a sizeable teardown that deserves its own verified pass — it has no user-facing benefit (the snapshots aren't shipped to users anymore; direct hits get the static priority pages).

---

_Original plan below (for reference)._

**Status:** Proposed (item 13 from the go-live analysis). Awaiting approval before any build.
**Goal:** Move the 24 non-priority content routes off the legacy Elementor snapshots (which load the ~263 KB vendor CSS bundle + SPA JS) onto the zero-JS priority SSG pattern, so they match the redesigned core and hit the same ~0.6 s LCP on 3G.

> Out of scope: the 5 commerce shells (`/cart/`, `/checkout/`, `/my-account/`, `/shop/`, `/manage-profile/`) stay as intentional assisted-commerce redirects to `/contact-us/`. The 6 already-redesigned priority routes + 3 new legal pages + 404 are done.

## The 24 routes, grouped

**Products (7)** — map 1:1 to `diy-*` entries in `src/checkout/catalog.ts`:
- `/product/becoming-a-job-magnet-on-linkedin/`, `/product/complete-grad-school-bundle/`, `/product/how-to-write-the-resume-that-lands-the-interview/`, `/product/mastering-the-art-of-job-hunting-in-the-uk-as-an-international-student/`, `/product/nailing-your-job-interviews/`, `/product/remote-job-playbook/`, `/product/the-complete-job-search-bundle/`

**Service-detail (8)** — the individual services linked from Career/Educational Services:
- `/curriculum-vitae/`, `/cover-letter/`, `/linkedin-optimization/`, `/reference-letter/`, `/statement-of-purpose/`, `/suggestion-of-schools/`, `/interview-preparation-session/`, `/career-strategy-session/`

**Blog (5)** — index + 4 posts:
- `/blog/` (index) · `/how-our-career-development-company-can-help-you-stand-out/` · `/how-to-boost-your-career-with-professional-resume-writing/` · `/the-importance-of-professional-documents-in-career-development/` · `/tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application/`

**Utility/misc (4):**
- `/faqs/` · `/job-readiness-bootcamp/` · `/jrb-thank-you/` · `/lets-keep-in-touch/`

## Strategy: 4 templates + data, not 24 pages

| Template | Drives | Data source |
|---|---|---|
| `ProductDetailPage` | 7 product routes | `catalog.ts` (price/SKU/deliverable) + a `products` content file (blurb, what's inside, format) — buy button loads the checkout island |
| `ServiceDetailPage` | 8 service routes | a `services` content file (hero, what's included, who it's for, price tiers from catalog) + CTA → checkout/contact |
| `BlogIndexPage` + `BlogPostPage` | 5 blog routes | post content extracted from snapshots into MD/MDX or a posts data file |
| Reuse / light-bespoke | `/faqs/` (reuse `FAQAccordion`), `/jrb-thank-you/` (clone `PaymentConfirmed`), `/job-readiness-bootcamp/` (service-style landing), `/lets-keep-in-touch/` (contact-style) | per-page |

This also needs a small **build refactor**: `PRIORITY_ROUTES` in `build-priority-routes.mjs` and `PRIORITY_PAGES` in `registry.ts` become partly **generated** from the data files/catalog, so 24 routes don't mean 24 hand-maintained entries in two places.

## Phases (each ends green: `build` + `audit` + smoke 35/35 + perf bench + visual check)

- **Phase 0 — Foundations (~0.5–1 day):** Build the `ProductDetail` + `ServiceDetail` templates and their data scaffolding; generate route entries; migrate **`/faqs/`** as the first live proof. Establishes the pattern + the per-route "drop from snapshot fallback" switch.
- **Phase 1 — Products (7) (~0.5 day):** All product pages via `ProductDetail` + catalog, with working buy buttons. Highest commercial value (these are purchase pages).
- **Phase 2 — Service-detail (8) (~0.5–1 day):** All service pages via `ServiceDetail`, CTAs wired to checkout/contact.
- **Phase 3 — Blog (5) (~0.5–1 day):** Index + 4 posts via the blog templates.
- **Phase 4 — Utility (3) (~0.5 day):** `job-readiness-bootcamp`, `jrb-thank-you`, `lets-keep-in-touch`.
- **Phase 5 — Decommission snapshots (~0.5 day):** For migrated routes, remove the SPA snapshot fallback, stop shipping the legacy vendor CSS to them, retire their `build-wordpress-html` slices, add them to `sitemap.xml`. Final full perf bench (target LCP < 2 s/3G across all), smoke, audit.

**Rough total: ~3–4 focused days.** Snapshots stay as the live fallback for any route until its redesign is verified, so there's no window where a page is broken.

## Decisions to confirm before Phase 0

1. **Copy:** faithful **verbatim** extraction from the snapshots first (fast, low-risk), then an optional on-brand polish pass via the `ech-brand-voice` system? Or rewrite on-brand as we go (slower, needs founder review)? *Recommended: verbatim-first, brand polish as a later pass.*
2. **Checkout on detail pages:** add buy buttons on **product** detail pages (definitely) and **service** detail pages (recommended) — both would load the checkout island like the current priority service pages.
3. **Blog content format:** store posts as MD/MDX files vs a structured data file. *Recommended: MD/MDX for author-friendliness.*

## Definition of done (per route)
Zero client JS (checkout island only where needed) · SEO title/description/canonical preserved from `pages.json` · smoke 200 · LCP < 2 s on Regular 3G · visual parity-or-better · snapshot fallback removed.
