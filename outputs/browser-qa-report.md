# Browser QA Report — Elevate Frontend Task-001

**Date:** 2026-05-09  
**QA agent:** Kofi  
**Result:** **FAIL — not release-ready**  
**Prior blocked caveat:** **Cleared.** Browser automation is available and was used successfully.

## Tooling / browser evidence

- Local build: `npm run build` — passed.
- Local preview: `npm run preview -- --port 4173` — served at `http://localhost:4173/`.
- Browser automation: Playwright CLI `Version 1.58.0` with cached Chromium from `~/Library/Caches/ms-playwright`.
- Automation module: global Playwright via `NODE_PATH=/opt/homebrew/lib/node_modules`.
- Browser used: headless Chromium.
- Raw evidence: `outputs/browser-qa/browser-qa-results.json`.
- Screenshots: `outputs/browser-qa/<route-label>/<viewport>/screenshot.png`.
- QA runner artifact: `outputs/browser-qa/run-browser-qa.cjs`.

## Commands run

```bash
npm run build
npm run preview -- --port 4173
NODE_PATH=/opt/homebrew/lib/node_modules node outputs/browser-qa/run-browser-qa.cjs

# Supplementary route / asset checks
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' http://localhost:4173/
curl -sI http://localhost:4173/assets/assets/assets/wp-content/uploads/2024/01/2-1024x474.png
curl -sI http://localhost:4173/assets/wp-content/uploads/2024/01/2-1024x474.png
```

## Routes and viewport coverage

All requested widths were tested where practical: **360, 390, 430, 768, 1024, 1280, 1440, 1920**.

Tested routes:

- `/`
- `/about/`
- `/career-services/`
- `/educational-services/`
- `/blog/`
- `/contact-us/`
- `/diy-products/`
- `/product/remote-job-playbook/` — representative product page from `outputs/route-map.md`
- `/how-to-boost-your-career-with-professional-resume-writing/` — representative blog post from `outputs/route-map.md`

Total screenshots captured: **72**.

## Pass / fail summary

### Passed

- Production build completed successfully.
- Preview server started successfully.
- All tested routes returned HTTP 200 at the Vite app shell level.
- No Playwright navigation crashes or uncaught test-runner failures.
- Mobile hamburger smoke test opened the menu on non-blank routes at 360, 390, and 430px.

### Failed

- Product page route renders blank because product snapshot HTML files are zero bytes.
- Major image asset paths are wrong across migrated snapshots (`/assets/assets/assets/...`), causing visible images to fail.
- Several pages have very low visible-text parity against preserved WordPress snapshots, especially Home, Career Services, Educational Services, and Blog.
- Console is noisy with CORS/font failures and resource load errors on every non-product route.
- Horizontal overflow exists on Home and Blog at selected viewports.

## Defects

### DEF-001 — Critical — Product pages render blank

**Affected route tested:** `/product/remote-job-playbook/` at all tested widths.  
**Additional evidence:** all product snapshot files under `public/snapshots/product-*.html` are `0` bytes.

**Reproduction:**
1. Start preview: `npm run preview -- --port 4173`.
2. Open `http://localhost:4173/product/remote-job-playbook/`.
3. Inspect page content.

**Expected:** Product detail page matching the WordPress product page.  
**Actual:** Page contains only the app shell / skip link; no product content, no navigation, no footer, no product image/copy.

**Screenshot evidence:** `outputs/browser-qa/product-remote-job-playbook/390/screenshot.png` and sibling viewport folders.

---

### DEF-002 — High — Migrated image assets are broken by incorrect URL rewriting

**Affected:** All non-product tested routes.  
**Evidence:** Broken visible image counts per viewport ranged from:

- Home: 29–30 broken images
- About: 8–9
- Career Services: 18–19
- Educational Services: 20–21
- Blog: 12–13
- Contact Us: 5–6
- DIY Products: 11–12
- Blog post: 6–7

**Root-cause indicator:** snapshots reference paths like:

```html
/assets/assets/assets/wp-content/uploads/2024/01/2-1024x474.png
```

but actual assets exist at:

```text
public/assets/wp-content/uploads/2024/01/2-1024x474.png
```

Supplementary curl evidence:

- Bad migrated path returns `200 text/html` from SPA fallback, not an image.
- Correct asset path returns `200 image/png`.

**Reproduction:**
1. Open `http://localhost:4173/`.
2. Inspect hero/logo/content images.
3. In DevTools or Playwright metrics, check `img.naturalWidth`.

**Expected:** All preserved WordPress images load.  
**Actual:** Many image elements fail to decode because they point to invalid triple-asset paths or malformed external URLs.

**Screenshot evidence:** `outputs/browser-qa/home/390/screenshot.png`, `outputs/browser-qa/diy-products/390/screenshot.png`, plus per-route folders.

---

### DEF-003 — High — Visual/text parity against preserved snapshots fails on key pages

**Affected:** `/`, `/career-services/`, `/educational-services/`, `/blog/`, and partially `/about/`, `/contact-us/`, `/diy-products/`.

**Evidence from lightweight parity check:** visible app text at 1280px was much shorter than preserved snapshot text on several routes:

- Home: similarity `0.1367`; visible text sample mostly footer/quicklinks.
- Career Services: similarity `0.1354`; visible text sample mostly FAQ/footer.
- Educational Services: similarity `0.1183`; visible text sample mostly FAQ/footer.
- Blog: similarity `0.4444`; visible text sample mostly footer.
- DIY Products: similarity `0.8696`; below pass threshold.

**Expected:** Rendered app should visually and textually match the preserved WordPress snapshot content.  
**Actual:** Large portions of key page content are not visible/rendered as expected in the automated browser view.

**Screenshot evidence:** per-route screenshots under `outputs/browser-qa/`.

---

### DEF-004 — Medium — Console errors on every non-product route

**Affected:** All non-product tested routes across all tested widths.

**Examples:**

- `Failed to load resource: net::ERR_NAME_NOT_RESOLVED`
- Font CORS errors from `https://elevatecareerhub.com/wp-content/plugins/.../*.woff2`

**Expected:** No console errors during normal route load.  
**Actual:** 14–27 console errors per non-product route/viewport.

**Impact:** This makes QA signal noisy and confirms unresolved external/malformed asset dependencies.

---

### DEF-005 — Medium/High — Horizontal overflow at selected breakpoints

**Affected viewports:**

- Home: 768px and 1280px
- Blog: 360px, 390px, 430px

**Reproduction:**
1. Open affected route at affected viewport.
2. Compare `document.documentElement.scrollWidth` vs `clientWidth`.

**Expected:** No horizontal scroll unless intentional.  
**Actual:** Body scroll width exceeds viewport width. Home at 1280px measured `1295px` scroll width.

**Screenshot evidence:** `outputs/browser-qa/home/1280/screenshot.png`, `outputs/browser-qa/blog/390/screenshot.png`.

## Menu / interaction check

Mobile hamburger/toggler was found and toggled open on every non-blank route at 360, 390, and 430px. Product page could not be meaningfully menu-tested because the route is blank.

## Residual coverage limits

- Chromium was the only automated browser available in the Playwright cache. Safari/iOS real-device behavior remains unverified.
- Visual parity was lightweight: automated screenshot capture plus text/snapshot comparison. Pixel-level visual regression was not run.
- No app code was changed; findings are documented only, per scope.

## Recommendation

Do **not** ship. Fix product snapshot generation, correct asset URL rewriting, eliminate malformed external resource references, then rerun the same browser QA matrix before release.
