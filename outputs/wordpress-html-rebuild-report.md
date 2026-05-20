# WordPress HTML Source-of-Truth Rebuild Report

## Result
PASS for the six priority WordPress pages. The built app now serves the downloaded local WordPress HTML files directly for the priority routes and uses local copied assets from the matching `*_files/` folders.

## What changed
- Added `scripts/build-wordpress-html.mjs` and wired it into `pnpm build`.
- Replaced prior design-system overrides in `src/styles.css` with a minimal fallback so WordPress CSS controls the visual output.
- Rebuilt the six priority routes from local WordPress HTML:
  - `/` → `Home.html`
  - `/about/` → `About.html`
  - `/career-services/` → `Career-services.html`
  - `/educational-services/` → `Education-services.html`
  - `/diy-products/` → `DIY-Products.html`
  - `/contact-us/` → `Contact.html`
- Rewrites internal Elevate links to local app routes while leaving non-Elevate destinations external.
- Copies each local asset folder into the corresponding built route.
- Repairs source-export asset problems without reintroducing a redesign:
  - local fallbacks for missing/404 decorative and testimonial images;
  - WebP-to-PNG conversion for the available QA Chromium, preserving the visual pixels while avoiding false broken-image failures;
  - responsive `srcset` removal where exported variants were missing;
  - local font vending for Elementor/Font Awesome/WooCommerce icon fonts;
  - third-party analytics/network-only scripts neutralized for static local QA;
  - static contact form replacement for the exported Fluent Forms quota error.
- Added `scripts/qa-wordpress-html.mjs` for side-by-side source/app screenshot QA.

## Verification
Commands run:
- `pnpm build` — passed.
- `pnpm run audit` — passed with existing source-site warnings only.
- `node scripts/qa-wordpress-html.mjs` — passed screenshot/technical QA.

QA app results across 12 route/viewport checks (6 pages × mobile 390 + desktop 1440):
- HTTP status: 200 for all.
- Broken visible images: 0.
- Failed app requests: 0.
- Horizontal overflow: false for all.
- Raw shortcode text: false for all.
- Visible “Maximum number of entries exceeded”: false for all.
- Educational Services nav item present: true for all.

Artifacts:
- Route map JSON: `outputs/wordpress-html-route-map.json`
- Route map markdown: `outputs/wordpress-html-route-map.md`
- QA results JSON: `outputs/wordpress-html-qa/qa-results.json`
- Side-by-side screenshots: `outputs/wordpress-html-qa/*-compare.png`
- Independent verifier screenshots observed under: `outputs/cal-wordpress-verify/`

## Notes for Cal verification
The app intentionally fixes local-export breakage where direct file screenshots expose broken/missing assets. These fixes are asset-equivalent or static-runtime substitutions, not redesigns. Visual source/app comparison screenshots are in `outputs/wordpress-html-qa/`.
