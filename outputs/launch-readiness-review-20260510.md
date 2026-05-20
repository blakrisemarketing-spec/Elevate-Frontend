# Elevate Frontend Launch-Readiness Review — 2026-05-10

## 1. Launch-readiness rubric and 9/10 bar

### Rubric
I scored the app as a conversion-focused public frontend, not as an internal prototype.

| Area | Weight | What I checked |
|---|---:|---|
| Build, deployment, and route integrity | 15 | Production build, static output shape, deep-link coverage, deployment config/readiness. |
| Route/content/brand completeness | 15 | Priority route coverage, source content fidelity, service/pricing clarity, trust content, navigation. |
| Conversion paths | 20 | Contact form, WhatsApp/email/social CTAs, product/service CTAs, commerce/contact handoff reliability. |
| Mobile responsiveness/visual QA | 10 | Core breakpoints, horizontal overflow, source/app visual evidence, mobile navigation. |
| Accessibility basics | 10 | Document titles, headings, alt text posture, keyboard/semantic basics, form accessibility. |
| SEO/share metadata | 10 | Titles, meta descriptions, canonical/OG/Twitter metadata, indexability. |
| Performance posture | 10 | Bundle/static size, duplicated assets, remote dependencies, avoidable failed requests/scripts. |
| QA reliability and launch risk controls | 10 | Verification commands, QA assertions that fail on real defects, known blockers vs warnings. |

### What earns 9/10
A 9/10 launch-readiness score requires all true launch blockers to be closed and evidence that:

- `pnpm build`, `pnpm run audit`, and browser QA pass with meaningful failure conditions.
- All launch-critical routes return 200 by direct URL in the intended deployment environment.
- No visible broken images, no user-facing quota/errors/shortcodes, no first-party app request failures, and no blocking browser errors on priority pages.
- The primary conversion path works end-to-end, or there is a clearly intentional and tested fallback such as WhatsApp/email with no broken form shown.
- Mobile layouts work at 360/390/430/768/1024/1440+ widths with no horizontal overflow and usable navigation/CTAs.
- Pages have non-empty document titles, sensible H1 structure, useful meta descriptions, canonical/OG/Twitter metadata, and no embarrassing share snippets.
- Accessibility basics are in place for public launch: headings, keyboard-visible controls, labels, and non-noisy image alt text.
- Performance is acceptable for a public marketing frontend: no multi-megabyte unnecessary CSS payloads, no duplicated WordPress/plugin bloat where avoidable, no repeated remote font/plugin failures.

A site can still have nice-to-have polish below this bar, but it cannot have broken conversion, visibly broken assets, empty browser titles, or unverified deployment/deep-link behavior.

## 2. Final score and verdict

**Score: 5.5 / 10**

**Verdict: NOT LAUNCH READY.**

The app has a working production build and six priority WordPress-source pages are generated into `dist`, but the fresh launch audit found multiple user-facing launch blockers: visible broken images across priority routes, the Contact page still exposes “Maximum number of entries exceeded.” instead of a working form/replacement, empty browser titles on all checked priority pages, missing H1s on five of six checked pages, repeated failed remote font/plugin requests, JavaScript errors on DIY Products, and no deployment/deep-link configuration for the full 35-route migrated set.

## 3. Evidence reviewed

### Files/reports inspected

- `/Users/greatdamzi/Projects/.dispatch/queue/elevate-frontend-20260510-001-spec.md`
- Project context and changelog:
  - `/Users/greatdamzi/Projects/.context/conventions.md`
  - `/Users/greatdamzi/Projects/.context/stack-preferences.md`
  - `/Users/greatdamzi/Projects/Elevate-Frontend/.context/main-context.md`
  - `/Users/greatdamzi/Projects/Elevate-Frontend/.context/changelogs/2026-05-09-001.md`
- App/source files:
  - `package.json`
  - `src/main.tsx`
  - `src/styles.css`
  - `scripts/build-wordpress-html.mjs`
  - `scripts/qa-wordpress-html.mjs`
  - `scripts/audit.mjs`
  - `src/generated/pages.json`
- Prior outputs:
  - `outputs/final-report.md`
  - `outputs/unresolved-notes.md`
  - `outputs/wordpress-html-rebuild-report.md`
  - `outputs/wordpress-html-route-map.md`
  - `outputs/audit-report.json`
  - `outputs/wordpress-html-qa/qa-results.json`

### Commands run during this review

- `pnpm build` — **passed**.
  - Vite output included `dist/assets/index-Bddt4HHT.css` at **2,929.09 kB uncompressed / 297.90 kB gzip** and JS at **207.90 kB / 63.75 kB gzip**.
  - Build copied **6 WordPress HTML source-of-truth routes** into `dist`.
- `pnpm run audit` — **passed with 15 warnings**.
  - Checked **35 pages, 969 links, 348 assets**.
  - Warnings include small/gated account/shop shells and missing source meta descriptions for product/shop/account pages.
- `node scripts/qa-wordpress-html.mjs` — process exited **0**, but the generated `outputs/wordpress-html-qa/qa-results.json` shows serious defects. The script currently records defects without failing the command.
- Extra viewport smoke check written to `outputs/launch-readiness-extra-viewport-check.json`.
  - Checked six priority routes at **360, 390, 430, 768, 1024, 1440** widths.

## 4. Audit by rubric

### 4.1 Build, deployment, and route integrity — weak pass with deployment risk

**Positive evidence**

- `pnpm build` completes successfully.
- The build script creates static `index.html` files for the six priority routes:
  - `/`
  - `/about/`
  - `/career-services/`
  - `/educational-services/`
  - `/diy-products/`
  - `/contact-us/`
- `pnpm run audit` passes the snapshot/link/asset inventory gate.

**Risks / failures**

- `src/generated/pages.json` contains **35 migrated routes**, but `dist` only has direct static `index.html` files for the six priority routes. Non-priority deep links depend on SPA fallback behavior.
- I found **no deployment config** such as `vercel.json`, `netlify.toml`, Firebase config, or `_redirects` in the project root. On many static hosts, direct requests to routes like `/blog/`, `/shop/`, product pages, or service detail pages will 404 unless a rewrite is configured.
- WooCommerce/cart/checkout/account pages are explicitly unresolved integration points in `outputs/unresolved-notes.md`.

**Assessment:** Buildable, but deployment/deep-link readiness is not proven.

### 4.2 Route/content/brand completeness — partial pass

**Positive evidence**

- The six priority routes are present and use local WordPress HTML source files per `outputs/wordpress-html-route-map.md`.
- Navigation includes primary sections such as Home, About, Educational Services, Career Services, Blog, Contact Us, and DIY Products in the QA-visible nav text.
- Source service/pricing content appears preserved in the WordPress HTML exports.

**Risks / failures**

- Current implementation is essentially a static WordPress export, not yet a polished modern conversion-focused rebuild.
- Several priority pages render with **no H1** in browser QA:
  - `/about/`
  - `/career-services/`
  - `/educational-services/`
  - `/diy-products/`
  - `/contact-us/`
- `/contact-us/` has only **658–669 visible text characters** in the fresh QA and is dominated by the broken form state.

**Assessment:** Content exists, but structural quality and conversion readiness are below launch standard.

### 4.3 Conversion paths — fail / launch blocker

**Positive evidence**

- Contact page contains working-looking fallback links in HTML:
  - WhatsApp: `https://wa.me/233531113454`
  - Email: `mailto:elevatewithnll@gmail.com`
- WhatsApp floating/chat configuration is present in the static HTML.

**Failures**

- The Contact page visibly contains: **“Maximum number of entries exceeded.”**
- Contact page SEO/share metadata also uses that bad text as the description:
  - `<meta name="description" content="Maximum number of entries exceeded.">`
  - `og:description` and Twitter description repeat it.
- `dist/contact-us/index.html` still contains:
  - `<div id="ff_form_1" class="ff_form_not_render">Maximum number of entries exceeded.</div>`
- No actual `<form>` inputs render in the checked priority pages; contact conversion relies on links while still showing the broken form area.
- DIY Products logs `Cannot read properties of undefined (reading 'success')` in QA, likely from retained WooCommerce/plugin scripts.

**Assessment:** This is a direct launch blocker. A public contact page cannot launch with a visible quota/error message replacing the form.

### 4.4 Mobile responsiveness / visual QA — partial pass with defects

**Positive evidence**

- `node scripts/qa-wordpress-html.mjs` checked six priority routes at 390 mobile and 1440 desktop.
- That QA found HTTP 200 responses for all checked route/viewport combinations.
- It found no horizontal overflow at 390 or 1440 in the main QA results.

**Additional evidence / failures**

The extra viewport smoke check found:

- `/` has horizontal overflow at **360px** and **768px**.
- `/about/` has horizontal overflow at **768px**.
- Contact form error visible at all checked widths: 360, 390, 430, 768, 1024, 1440.
- All checked pages have empty browser titles at all widths.

**Assessment:** Responsiveness is partly proven but not launch-clean. Overflow remains at real breakpoints.

### 4.5 Accessibility basics — fail

**Failures**

- Browser `document.title` is empty on all six priority routes in fresh QA.
- Five of six priority routes have zero H1s in fresh browser QA.
- The static WordPress pages overwritten into `dist` do not include the React skip link from `src/main.tsx` on the six priority routes.
- Image alt posture is weak: counts from generated HTML show most images have empty `alt` attributes:
  - Home: 28 empty alt values out of 33 images.
  - About: 11 empty alt values out of 13 images.
  - Career Services: 20 empty alt values out of 22 images.
  - Educational Services: 22 empty alt values out of 24 images.
  - DIY Products: 7 empty alt values out of 15 images.
  - Contact: 7 empty alt values out of 9 images.
- The primary form does not render, so form labels/validation cannot be considered accessible.

**Assessment:** Does not meet basic public-site accessibility readiness.

### 4.6 SEO/share metadata — fail

**Positive evidence**

- Rank Math-style meta description/OG tags exist in static HTML.
- Canonical links exist, though many are relative after rewrite.

**Failures**

- No `<title>` tags were found in the six checked built HTML pages; browser title is empty for all six priority routes.
- Contact metadata is actively harmful because it says “Maximum number of entries exceeded.”
- Several meta descriptions are thin/generic, e.g. Home: “Welcome to elevate”, About: “About Us”, DIY Products: “DIY PRODUCTS”.
- Product/shop/account meta-description warnings persist in `pnpm run audit`.

**Assessment:** Not SEO/share ready for launch.

### 4.7 Performance posture — weak / not launch optimized

**Evidence**

- `dist` size is approximately **58 MB**.
- `dist/assets` is approximately **24 MB**.
- Main Vite CSS bundle is approximately **2.9 MB uncompressed**.
- Each priority route carries large WordPress export asset folders around **2.7–3.4 MB**.
- The app repeatedly attempts to fetch remote WordPress/plugin fonts from `https://elevatecareerhub.com/wp-content/plugins/...`, producing **102 failed app requests** across 12 QA checks.

**Assessment:** Performance is acceptable only as a migration snapshot, not as a polished launch frontend. The remote failed font requests are also reliability defects, not just performance issues.

### 4.8 QA reliability and risk controls — fail until assertions are tightened

**Positive evidence**

- The project has audit and QA scripts.
- Build and audit commands are runnable in the current environment.
- Browser automation is available and produced screenshots/results.

**Failures**

- `scripts/qa-wordpress-html.mjs` exits 0 even while `qa-results.json` records:
  - **49 visible broken images** across app route/viewport checks.
  - **102 failed app requests**.
  - **2 page errors** on DIY Products.
  - Contact entry-limit message visible in both mobile and desktop checks.
- Prior `outputs/wordpress-html-rebuild-report.md` says 0 broken visible images and no entry-limit message, but a fresh run on the current code contradicts that. Current evidence should override the stale report.

**Assessment:** QA artifacts exist, but the pass/fail gate is not trustworthy enough for launch.

## 5. Current fresh QA defect summary

Fresh `outputs/wordpress-html-qa/qa-results.json` app-side totals from `node scripts/qa-wordpress-html.mjs`:

| Route | Broken visible images across 390/1440 | Failed app requests | Page errors | Contact quota/error visible |
|---|---:|---:|---:|---|
| `/` | 17 | 14 | 0 | No |
| `/about/` | 4 | 14 | 0 | No |
| `/career-services/` | 11 | 14 | 0 | No |
| `/educational-services/` | 13 | 20 | 0 | No |
| `/diy-products/` | 2 | 26 | 2 | No |
| `/contact-us/` | 2 | 14 | 0 | Yes |
| **Total** | **49** | **102** | **2** | **Yes** |

Representative broken image paths include:

- `/Home_files/shape_Asset-6.png`
- `/Home_files/Number-1.webp`, `/Number-2.webp`, `/Number-3.webp`
- `/Home_files/portrait-of-mid-adult-businesswoman-smiling-agains-5F3S7X7.jpg`
- `/Home_files/composite-collage-of-happy-diverse-multicultural-y2/y3/y4/y5-G8UCHFH.jpg`
- `/about/About_files/Asset-14.png`
- `/career-services/Career-services_files/Nhyira.jpg`
- `/educational-services/Education-services_files/Price-icon-2.webp`
- Remote `https://elevatecareerhub.com/wp-content/uploads/2024/01/Frame-second-600x1000.webp`
- Remote `https://elevatecareerhub.com/wp-content/uploads/2024/01/Frame-second-614x1024.webp`

Representative failed remote font/plugin requests include:

- Font Awesome solid/regular/brands `.woff2`, `.woff`, `.ttf`
- Elementskit icon font `.woff`
- WooCommerce font `.woff2`, `.woff`, `.ttf`

## 6. Required fixes to reach 9/10

### P0 — launch blockers

| Priority | Required fix | Rationale | Suggested owner | Verification method |
|---|---|---|---|---|
| P0 | Replace the broken Contact page Fluent Forms output with a real working contact flow or a deliberately designed static fallback form/CTA block. Remove all visible “Maximum number of entries exceeded.” text from body and metadata. | Primary conversion path is broken and embarrassing. Current Contact page is not launchable. | Devon + Mara; Nova for fallback copy. | Browser QA on `/contact-us/` at 360/390/430/768/1024/1440 confirms no entry-limit text, form or fallback CTA visible, WhatsApp/email links work, metadata is clean. Add an assertion that fails if entry-limit text appears. |
| P0 | Repair or remove all visible broken images on six priority routes. | Broken hero/testimonial/decorative assets damage trust and currently appear across all key service routes. | Devon + Sanaa. | `node scripts/qa-wordpress-html.mjs` must report 0 visible broken images; manually review comparison screenshots. Add script exit failure on broken image count > 0. |
| P0 | Remove/neutralize failed remote WordPress/plugin font requests and remaining plugin scripts that error. Vendor required fonts locally or strip unused CSS references. | Fresh QA records 102 failed app requests and two JS page errors. Public launch should not ship repeated failed dependencies. | Devon + Iris. | Browser QA reports 0 failed app requests for first-party pages, 0 page errors. Network tab confirms no required asset loads from old WordPress plugin paths. |
| P0 | Add valid `<title>` tags / browser document titles for every launch-critical page. | All six priority routes have empty browser titles, which is a basic SEO/accessibility failure. | Devon + Nova. | Playwright/QA assertion: `document.title.trim().length > 0` on every priority route; source HTML contains a matching `<title>`. |
| P0 | Restore sane heading structure, especially H1s, on all priority pages. | Five of six priority routes have no H1 in browser QA; this weakens accessibility, SEO, and page comprehension. | Sanaa + Nova + Devon. | QA assertion: exactly one clear page-level H1, or documented exception, on each priority route. |
| P0 | Fix horizontal overflow on Home at 360/768 and About at 768. | The site must be mobile-first and usable on common device widths. | Sanaa + Devon. | Extra viewport QA at 360/390/430/768/1024/1440 reports `overflowX: false` for all priority routes. |
| P0 | Make browser QA fail on launch-blocking defects. | Current QA script exits 0 while logging broken images, failed requests, page errors, and contact quota text. This can produce false launch confidence. | Kofi. | CI/local QA exits non-zero for broken images, failed app requests, page errors, horizontal overflow, raw shortcodes, entry-limit text, empty titles, missing H1s. |

### P1 — required before public launch, but after P0 blockers

| Priority | Required fix | Rationale | Suggested owner | Verification method |
|---|---|---|---|---|
| P1 | Add deployment config for the chosen host and prove direct deep links. | 35 routes are in the manifest, but only six have direct static files. SPA fallback/deep-link behavior is not configured. | Iris + Devon. | Deploy-preview smoke checks direct URLs for all launch routes: 200 status and correct content. Include host rewrite config such as `vercel.json`, `netlify.toml`, or equivalent. |
| P1 | Decide commerce/product behavior for DIY Products, shop, cart, checkout, and account. | WooCommerce dynamic behavior remains unresolved. DIY Products logs JS errors; cart/checkout/account are visual shells. | Mara + Iris + Devon. | Product CTA path either intentionally links out to live WordPress/payment or is rebuilt/tested. Cart/checkout/account are removed, redirected, or integrated. |
| P1 | Clean SEO/share metadata for all launch-critical pages. | Existing meta descriptions are thin and Contact is actively wrong. | Nova + Devon. | Metadata QA validates title, description, canonical, OG/Twitter title/description/image for each launch route. Preview social snippets. |
| P1 | Reduce static/performance bloat enough for launch. | 58 MB dist, 2.9 MB CSS, duplicated WordPress exports, and remote failed fonts are not ideal for a fast public frontend. | Devon + Iris. | Lighthouse/WebPageTest or Playwright trace on preview; define budget, e.g. no critical CSS/plugin bloat beyond required WP parity, no failed network requests, reasonable LCP on mobile. |
| P1 | Improve accessibility baseline. | Empty titles/H1s are P0; image alt, skip link, keyboard nav, and form labels also need public-site polish. | Sanaa + Devon. | Axe or equivalent pass on priority pages; manual keyboard nav through menu/CTAs/contact path. |

### P2 — nice-to-haves / post-blocker polish

| Priority | Fix | Rationale | Suggested owner | Verification method |
|---|---|---|---|---|
| P2 | Replace raw WordPress-export markup with the intended modern React/Tailwind design system once launch parity blockers are fixed. | Better maintainability, performance, brand polish, and conversion optimization. | Sanaa + Devon + Nova. | Visual QA, content QA, Lighthouse comparison. |
| P2 | Add analytics/events intentionally rather than shipping old WordPress plugin scripts. | Cleaner data and fewer third-party side effects. | Iris + Devon + Mara. | Events fire only for approved CTAs/forms; no old plugin noise. |
| P2 | Add regression screenshots to CI or a deterministic local QA command. | Prevents future contradiction between reports and current app state. | Kofi. | One command produces route/viewport screenshots and fails on critical thresholds. |

## 7. Blockers vs nice-to-haves

### True launch blockers

- Contact page form/conversion path visibly broken.
- Visible broken images across priority routes.
- Empty browser titles on priority routes.
- Missing H1s on five priority routes.
- Failed remote app requests and DIY JavaScript errors.
- Horizontal overflow at some required widths.
- QA script exits success despite launch-blocking defects.
- Deployment/deep-link behavior for full migrated route set is not configured/proven.

### Not launch blockers by themselves

- The app is still a WordPress-export/static snapshot rather than the final modern design system.
- CSS/asset payload is heavy if all blockers are fixed and performance is still acceptable enough for business goals.
- WooCommerce/account pages can remain external or deferred if Mara explicitly removes them from launch scope and all CTAs route to a working alternative.

## 8. Recommendation

Do **not** launch this version. Dispatch a focused blocker-fix pass first:

1. Devon fixes Contact fallback/form, broken assets, remote font/script failures, titles, and deployment rewrites.
2. Sanaa fixes responsive overflow and heading/layout accessibility issues.
3. Nova supplies clean titles/meta descriptions/H1 copy and contact fallback copy.
4. Kofi upgrades QA assertions so defects fail the command.
5. Mara decides whether commerce is in scope for launch or routes products to WhatsApp/external checkout.

After those are complete, rerun:

```bash
pnpm build
pnpm run audit
node scripts/qa-wordpress-html.mjs
```

Then rerun the extra viewport/metadata checks and only consider launch-ready if the score reaches at least **9/10** with zero P0 blockers.
