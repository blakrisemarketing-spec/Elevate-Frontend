# Launch Readiness Evidence Pack — Elevate Frontend — 2026-05-10

**Compiled by:** Kofi (QA Engineer) — Workstream E
**Dispatch:** `outputs/mara-launch-fix-dispatch-20260510.md`
**Implementation report (A–D):** `outputs/elevate-frontend-20260510-002-implementation-report.md`
**Status:** Ready for independent re-review.

---

## 1. Verification command results

All commands run from `/Users/greatdamzi/Projects/Elevate-Frontend` against the post-fix build.

| Gate | Command | Exit | Headline result |
|---|---|---:|---|
| 1a Build | `pnpm build` | 0 | `tsc -b && vite build && build-wordpress-html.mjs` all clean. 35 routes emitted; 6 priority routes use the WordPress source-of-truth render. |
| 1b Audit | `pnpm run audit` | 0 | `Audit passed: 35 pages, 969 links, 348 assets, 15 warning(s).` Warnings are all source-WordPress missing-description on individual product/blog pages or intentional commerce/account redirect shells — none on launch-priority routes. Documented as non-launch-blocking in the implementation report §6 and §7. |
| 2 Hardened QA | `node scripts/qa-wordpress-html.mjs` | 0 | `Result: PASS (exit 0)` — 0 blockers across 18 categories × 6 routes × 2 viewports. |
| 3 Extra viewports | `node scripts/qa-wordpress-extra-viewports.mjs` | 0 | `{ brokenVisibleImages: 0, overflowCases: 0, entryLimitCases: 0, pageErrors: 0, failedRequests: 0 }` across 6 routes × 6 widths (360/390/430/768/1024/1440 = 36 combos). |
| 5 Direct route smoke | `node scripts/smoke-direct-routes.mjs` | 0 | `Direct route smoke passed for 35 migrated route(s).` 0 failures. |

Offline gate-logic verification: `node /tmp/qa-gate-logic-verify.mjs` (log saved to `outputs/qa-gate-logic-verify-20260510.log`) — baseline passes; 16/16 synthetic defect-injection scenarios correctly trip the expected blocker category.

---

## 2. Evidence file pointers

### QA JSON output
- **Hardened priority QA:** `/Users/greatdamzi/Projects/Elevate-Frontend/outputs/wordpress-html-qa/qa-results.json`
  - Now includes top-level `pass`, `totalBlockers`, `blockerCounts`, `blockerLabels`, `failures`, `failedRequestAllowlist`, `h1ExceptionSlugs`.
- **Extra viewport QA:** `/Users/greatdamzi/Projects/Elevate-Frontend/outputs/wordpress-html-extra-viewport-qa/extra-viewport-results.json`
  - Authoritative companion file: `/Users/greatdamzi/Projects/Elevate-Frontend/outputs/launch-readiness-extra-viewport-check.json`
- **Direct route smoke:** `/Users/greatdamzi/Projects/Elevate-Frontend/outputs/direct-route-smoke-20260510.json` and `direct-route-smoke-20260510.md`
- **Route launch classification:** `/Users/greatdamzi/Projects/Elevate-Frontend/outputs/route-launch-classification-20260510.json` and `route-launch-classification-20260510.md`
- **WordPress route map:** `/Users/greatdamzi/Projects/Elevate-Frontend/outputs/wordpress-html-route-map.json`
- **Audit report:** `/Users/greatdamzi/Projects/Elevate-Frontend/outputs/audit-report.json`

### Screenshot directories
- **Priority routes (mobile390 + desktop1440 — source/app/comparison):** `/Users/greatdamzi/Projects/Elevate-Frontend/outputs/wordpress-html-qa/`
  - `*-source.png` — local WordPress source render (reference, not under gate).
  - `*-app.png` — deployed app render (gate target).
  - `*-compare.png` — side-by-side composite for manual inspection.
- **Extra viewport screenshots (6 widths × 6 routes = 36 PNGs):** `/Users/greatdamzi/Projects/Elevate-Frontend/outputs/wordpress-html-extra-viewport-qa/`

### Deployment configuration files present
- `/Users/greatdamzi/Projects/Elevate-Frontend/vercel.json` — Vercel config (`trailingSlash: true`, commerce/account 302s, legacy `/index.php/...` aliases, security headers).
- `/Users/greatdamzi/Projects/Elevate-Frontend/netlify.toml` — Netlify config (build command, redirects, SPA fallback, security headers).
- `/Users/greatdamzi/Projects/Elevate-Frontend/dist/_redirects` — Netlify/Cloudflare-Pages-format redirect manifest (regenerated each build).

Deployment strategy: **direct-static deep links** + **host-aware redirect/rewrite layer**. Every route in `src/generated/pages.json` (35 routes) is emitted as `dist/<route>/index.html`. Deep links resolve on any static host without rewrites; the three host configs are defense-in-depth.

Target hosts supported by the configs in this order of confidence:
1. **Vercel** — `vercel.json` is canonical.
2. **Netlify** — `netlify.toml` is canonical; `dist/_redirects` also honored.
3. **Cloudflare Pages** — `dist/_redirects` is canonical.
4. **Any plain static host (S3, GitHub Pages, Nginx)** — direct file-tree resolution works without config.

---

## 3. Defect-zero summary table

Counts are post-fix, taken from the hardened gate's `blockerCounts` (priority routes × mobile390 + desktop1440). All thresholds are **0** — any non-zero count fails the gate.

| Launch-blocker category | Threshold | Current count | Status |
|---|---:|---:|---|
| Priority route HTTP status != 200 | 0 | 0 | PASS |
| Visible broken images | 0 | 0 | PASS |
| JS page errors | 0 | 0 | PASS |
| Failed app requests (post-allowlist) | 0 | 0 | PASS |
| Horizontal overflow on required viewport | 0 | 0 | PASS |
| Visible "Maximum number of entries exceeded." | 0 | 0 | PASS |
| Visible form quota / submission-disabled message | 0 | 0 | PASS |
| Entry-limit text leaked into metadata | 0 | 0 | PASS |
| Raw shortcode token visible (`[fluentform`, `[woocommerce_`, `[product_`, `[wpforms`, `[contact-form-7`, `[gravityform`, `[eael-`, `[elementor-template`) | 0 | 0 | PASS |
| Empty `<title>` on priority route | 0 | 0 | PASS |
| Missing page-level `<h1>` on priority route | 0 | 0 | PASS |
| Required nav items missing (home / about / contact) | 0 | 0 | PASS |
| Missing meta description | 0 | 0 | PASS |
| Missing canonical link | 0 | 0 | PASS |
| Missing OG title or description | 0 | 0 | PASS |
| Missing Twitter title or description | 0 | 0 | PASS |
| `/contact-us/` missing visible WhatsApp + email CTAs | 0 | 0 | PASS |
| Contact CTA href does not match dispatched destinations | 0 | 0 | PASS |

Extra-viewport gate (6 widths × 6 routes):

| Category | Threshold | Current | Status |
|---|---:|---:|---|
| brokenVisibleImages | 0 | 0 | PASS |
| overflowCases | 0 | 0 | PASS |
| entryLimitCases | 0 | 0 | PASS |
| pageErrors | 0 | 0 | PASS |
| failedRequests | 0 | 0 | PASS |

Direct-route smoke:

| Category | Threshold | Current | Status |
|---|---:|---:|---|
| Migrated routes failing 200/redirect contract | 0 | 0/35 | PASS |

---

## 4. Documented exceptions

- **Failed-request allowlist:** **EMPTY.** No external host is currently allowlisted. The hardened script in `scripts/qa-wordpress-html.mjs` defines a `FAILED_REQUEST_ALLOWLIST` array with documentation; any future entry must include a one-line justification.
- **H1 exception slugs:** **EMPTY.** Every priority route currently has its dispatched single H1. The hardened script defines `H1_EXCEPTION_SLUGS` with documentation for future use.
- **Audit warnings (15):** Carried over from the implementation report. All in two non-launch categories — (a) intentional commerce/account redirect shells (`/cart/`, `/checkout/`, `/my-account/`, `/shop/`, `/manage-profile/`, `/lets-keep-in-touch/`); (b) source-WordPress missing meta description on individual product/blog pages (non-priority). None apply to the six launch-priority routes.

---

## 5. Statement of readiness

The frontend now satisfies every objective acceptance criterion defined in Mara's launch-fix dispatch §A/B/C/D, and the QA gate has been hardened so that any regression in those areas — broken images, page errors, failed app requests, overflow, entry-limit text in body or metadata, raw shortcodes, empty titles, missing H1s, missing meta/OG/Twitter, missing/invalid contact CTAs, or missing nav items — produces an immediate non-zero exit code from `node scripts/qa-wordpress-html.mjs`.

Gate truthfulness has been verified two ways:
1. **Runtime PASS on current dist** — all five gates exit 0 with all category counts at zero.
2. **Synthetic defect-injection** — 16/16 simulated defects matching the original 5.5/10 review tripped the correct blocker category in the hardened evaluation logic; the gate is provably loud on regressions, not silently permissive.

**Recommendation:** This evidence pack is sufficient for an independent launch-readiness re-review against the ≥9/10 bar. No P0 launch blockers remain in the QA-observable surface.
