# Kofi QA Report — Workstream E (QA Truth Gate Hardening) — 2026-05-10

**Owner:** Kofi (QA Engineer)
**Spec:** `outputs/mara-launch-fix-dispatch-20260510.md` §Workstream E + §Verification gates
**Companion:** `outputs/launch-readiness-evidence-20260510.md`
**Implementation under test:** `outputs/elevate-frontend-20260510-002-implementation-report.md` (Workstreams A–D)

---

## 1. What I changed in `scripts/qa-wordpress-html.mjs`

The pre-existing script captured rich metrics into JSON but always exited 0 — it could record launch-blocking defects without failing the build. I left the screenshot/comparison capture untouched (Devon and Sanaa still need those for visual review) and hardened the evaluation layer.

### Diff summary

1. **New configurable surfaces (top of file, near the `routes`/`viewports` config):**
   - `FAILED_REQUEST_ALLOWLIST` — documented array for external non-critical hosts. Each entry must include a `pattern: RegExp` and a `reason: string`. Currently empty.
   - `H1_EXCEPTION_SLUGS` — documented `Set<string>` for routes intentionally allowed to lack an H1. Currently empty.

2. **Expanded per-page metric collection inside `page.evaluate`:**
   - `brokenImageCount` (was only the truncated 10-item array; now also the integer total).
   - `rawShortcodeMatches` — explicit detection of `[fluentform...]`, `[woocommerce_...]`, `[product_...]`, `[wpforms...]`, `[contact-form-7...]`, `[gravityform...]`, `[eael-...]`, `[elementor-template...]` and their closing tags. (Generic `\[token\]` detection retained as informational.)
   - `visibleFormQuotaMessage` — broader pattern set beyond the specific Fluent Forms string (`maximum number of entries`, `form submission limit`, `this form is no longer accepting submissions`, `form is currently disabled`).
   - `entryLimitInMetadata` — checks `<title>`, `meta[name="description"]`, `og:title`, `og:description`, `twitter:title`, `twitter:description` for entry-limit text leakage.
   - `metadata.{description,canonical,ogTitle,ogDescription,twitterTitle,twitterDescription}` — extracted from the DOM.
   - `whatsappLinkCount`, `whatsappVisibleCount`, `mailtoLinkCount`, `mailtoVisibleCount` — exact-match against `https://wa.me/233531113454` and `mailto:elevatewithnll@gmail.com` from Mara's dispatch §4.
   - `navHasRequired` — booleans confirming nav contains `home`, `about`, `contact` link tokens.

3. **New hardened post-collection evaluation block (replaces the old summary write):**
   - 18 distinct blocker categories evaluated against each priority-route × viewport `app` capture. (Source captures are intentionally NOT under the gate — the raw WordPress export legitimately has broken images and is reference-only.)
   - Each blocker accumulates into `counts[category]` and pushes a structured record into `failures[]`.
   - Top-level fields added to `qa-results.json`: `pass`, `totalBlockers`, `blockerCounts`, `blockerLabels`, `failures`, `failedRequestAllowlist` (serialised), `h1ExceptionSlugs`.
   - Console pass/fail summary printed with `[PASS]`/`[FAIL]` per category, total blocker count, and first-20 failure detail lines.
   - `process.exitCode = 1` set when `totalBlockers > 0`. Exit 0 otherwise.

The changes are isolated to `scripts/qa-wordpress-html.mjs`. Per the dispatch I made **no edits** to `scripts/build-wordpress-html.mjs`, `scripts/qa-wordpress-extra-viewports.mjs`, `scripts/smoke-direct-routes.mjs`, `scripts/audit.mjs`, or any source HTML.

---

## 2. Allowlist decisions

- **Failed-request allowlist:** EMPTY. After Workstream D's remote-dependency cleanup, the priority routes have zero remote plugin/font requests. There is no external dependency that warrants exemption today. The data structure and documentation are in place for any future, intentional external request — each future entry must carry a one-line justification approved by Mara/Iris.
- **H1 exception slugs:** EMPTY. Every priority route now ships with its dispatched single H1 (Workstream C copy package). No exception is needed.

This is the strict-by-default posture the dispatch asks for. I am not relaxing assertions to make the build pass.

---

## 3. Gate exit-code logic — what triggers non-zero

`process.exitCode` is set to `1` if `totalBlockers > 0`, where any of the following increments `totalBlockers` for any priority-route × viewport:

| Category | Trigger condition |
|---|---|
| `routeStatusNon200` | `app.status !== 200` |
| `brokenImages` | `metrics.brokenImageCount > 0` |
| `pageErrors` | `app.pageErrors.length > 0` (any `pageerror` event during navigation) |
| `failedRequests` | `app.failedRequests.length > 0` after filtering against `FAILED_REQUEST_ALLOWLIST` |
| `overflowX` | `metrics.scrollWidth > metrics.innerWidth + 2` |
| `visibleEntryLimit` | regex `maximum number of entries[\s\S]{0,40}exceeded` matches `document.body.innerText` |
| `formQuotaMessage` | broader form-quota / submissions-disabled patterns match (and `visibleEntryLimit` did not already fire on the same node) |
| `entryLimitMetadata` | the same regex matches any of `<title>`, `meta[description]`, `og:title`, `og:description`, `twitter:title`, `twitter:description` |
| `rawShortcode` | one of the explicit shortcode tokens appears bracketed in `document.body.innerText` |
| `emptyTitle` | `document.title` is empty / whitespace-only |
| `missingH1` | zero `<h1>` elements AND slug not in `H1_EXCEPTION_SLUGS` |
| `navUnusable` | nav links lack at least one of `home` / `about` / `contact` (case-insensitive) |
| `missingMetaDescription` | `meta[name="description"]` missing or empty |
| `missingCanonical` | `link[rel="canonical"]` missing or empty |
| `missingOg` | either `og:title` or `og:description` missing/empty |
| `missingTwitter` | either `twitter:title` or `twitter:description` missing/empty |
| `missingContactCtas` | route is `/contact-us/` AND visible WhatsApp count <1 OR visible mailto count <1 |
| `invalidContactCtaHref` | route is `/contact-us/` AND no `https://wa.me/233531113454` link OR no `mailto:elevatewithnll@gmail.com` link |

Every category prints to console as `[PASS]` (count = 0) or `[FAIL]` (count > 0), so a human scanning CI logs can tell at a glance which axis broke.

---

## 4. Verification results

### 4.1 Runtime gates (against current post-fix dist)

| Command | Exit code | Notes |
|---|---:|---|
| `pnpm build` | 0 | tsc + vite + WordPress HTML rebuild all clean. CSS warning is a pre-existing empty-vendor-CSS import; not launch-blocking. |
| `pnpm run audit` | 0 | 35 pages, 969 links, 348 assets, 15 warnings — all on non-priority commerce/account shells or source-WordPress missing-description on product/blog pages. |
| `node scripts/qa-wordpress-html.mjs` (hardened) | 0 | All 18 blocker categories at 0. `pass: true`, `totalBlockers: 0`. |
| `node scripts/qa-wordpress-extra-viewports.mjs` | 0 | `{ brokenVisibleImages: 0, overflowCases: 0, entryLimitCases: 0, pageErrors: 0, failedRequests: 0 }` across 6 routes × 6 widths = 36 combos. |
| `node scripts/smoke-direct-routes.mjs` | 0 | 35/35 routes pass the 200 / intentional-redirect contract. |

### 4.2 Gate truthfulness — defect-injection scenarios

I wrote an offline harness (`/tmp/qa-gate-logic-verify.mjs`, log saved to `outputs/qa-gate-logic-verify-20260510.log`) that:
1. Loads the real `outputs/wordpress-html-qa/qa-results.json`.
2. Re-applies the script's evaluation rules locally (faithful copy).
3. Confirms baseline passes (it does: 0 failures).
4. Mutates a deep clone for each of 16 synthetic defect scenarios and confirms the right blocker category is tripped.

**Result: 16 / 16 scenarios trip the expected category, including all original 5.5/10-review defects.**

| Original 5.5/10 defect | Hardened-gate category that catches it | Verified |
|---|---|---|
| 49 broken visible images on priority routes | `brokenImages` | YES |
| 102 failed app requests (legacy plugin/font URLs) | `failedRequests` (post-allowlist) | YES |
| Page errors on `/diy-products/` (`Cannot read properties of undefined (reading 'success')`) | `pageErrors` | YES |
| Horizontal overflow Home@360, Home@768, About@768 | `overflowX` | YES |
| Visible "Maximum number of entries exceeded." on `/contact-us/` | `visibleEntryLimit` | YES |
| Entry-limit text leaked into Contact metadata (title / description / OG / Twitter) | `entryLimitMetadata` | YES |
| Empty `<title>` on all six priority routes | `emptyTitle` | YES |
| Missing H1 on five of six priority routes | `missingH1` | YES |
| (additional hardening) raw `[fluentform]`, `[woocommerce_…]`, etc. | `rawShortcode` | YES |
| (additional hardening) missing meta description / canonical / OG / Twitter | `missingMetaDescription` / `missingCanonical` / `missingOg` / `missingTwitter` | YES |
| (additional hardening) Contact CTAs invisible or hrefs wrong | `missingContactCtas` / `invalidContactCtaHref` | YES |
| (additional hardening) nav lacks home/about/contact | `navUnusable` | YES |
| (additional hardening) priority route HTTP non-200 | `routeStatusNon200` | YES |

This is the "would have failed before" verification. The gate is provably loud, not silently permissive.

### 4.3 Evidence pack

Compiled at `/Users/greatdamzi/Projects/Elevate-Frontend/outputs/launch-readiness-evidence-20260510.md`. It contains the exit-code table, evidence file pointers (QA JSON + screenshot directories + smoke + classification + audit), the deployment-config inventory, the defect-zero summary table, documented exceptions (none active), and the readiness statement.

---

## 5. Confidence statement

**Yes — this app is ready for independent re-review.**

What I am asserting:
- Every objective acceptance criterion in dispatch §A/B/C/D is met on the current dist as observable through automated browser QA, audit, and direct-route smoke.
- The QA gate is now structurally honest. It will exit non-zero on any regression in 18 launch-blocker categories. The previous "exit 0 with defects in JSON" behaviour is gone.
- No assertions were softened to achieve a passing build. No allowlist entry was added to bypass real failures. No H1 exception was added to mask missing copy.

What I am explicitly NOT asserting (within scope of automated browser QA):
- Lighthouse/Core-Web-Vitals scoring on real throttled mobile connections. Not in dispatch §E and the implementation report flags CSS payload (~2.9 MB / ~298 kB gzip) as a P2.
- Cross-browser parity in Safari iOS/macOS, Firefox, Edge. The Playwright runner uses Chromium only; Mara's launch rubric may want a manual or BrowserStack pass before final sign-off.
- Screen-reader / keyboard / colour-contrast verification at WCAG depth. The hardened gate covers titles, H1s, alt presence (via image inventory), nav usability, and CTA validity, but a full a11y audit is a separate workstream.
- Live deployment verification on the chosen host (Vercel / Netlify / Cloudflare Pages). The configs are in place and the local file-server smoke is green; first deploy should still be smoke-tested at the real domain.

These are the residual risks Mara's re-review can choose to accept against the ≥9/10 bar or escalate as P1/P2 follow-ups. They are not P0 launch blockers in the QA-observable surface.

---

## 6. Files touched

- `scripts/qa-wordpress-html.mjs` — hardened evaluation layer + exit code (this report §1).
- `outputs/wordpress-html-qa/qa-results.json` — regenerated with new `pass`, `totalBlockers`, `blockerCounts`, `blockerLabels`, `failures`, allowlist, exception fields.
- `outputs/wordpress-html-extra-viewport-qa/extra-viewport-results.json` — regenerated.
- `outputs/wordpress-html-qa/*.png` and `outputs/wordpress-html-extra-viewport-qa/*.png` — regenerated.
- `outputs/direct-route-smoke-20260510.{json,md}` — regenerated.
- `outputs/audit-report.json` — regenerated.
- `outputs/launch-readiness-evidence-20260510.md` — new (companion to this report).
- `outputs/elevate-frontend-20260510-002-kofi-qa-report.md` — this report.
- `outputs/qa-gate-logic-verify-20260510.log` — saved gate-truthfulness verification log.

No source HTML, build script, or component code was modified.
