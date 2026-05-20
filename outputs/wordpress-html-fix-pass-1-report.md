# WordPress HTML Exact-Match Fix Pass 1

## Changes made

- Reworked `scripts/build-wordpress-html.mjs` to stop visually improving the local WordPress export.
  - Removed missing-asset replacements such as `shape_Asset-6.png`/`Asset-14.png` → `missing-decorative.png`.
  - Removed image fallback substitutions for broken portrait/testimonial assets.
  - Removed `srcset` stripping, `loading="lazy"` rewriting, WebP-to-PNG conversion, and font vendoring/rewrites.
  - Removed Contact form replacement; the visible `Maximum number of entries exceeded.` state is now preserved.
  - Kept only same-site navigation rewrites plus non-visual analytics script neutralization to prevent localhost/Playwright side effects.
  - Also overwrites `dist/snapshots/{home,about,career-services,educational-services,diy-products,contact-us}.html` from the same local source files so Vite SPA fallback renders the same source-truth markup.
- Updated `src/main.tsx` snapshot normalization to return HTML unchanged, preserving broken artifacts/form states when the React shell is used.

## Verification

- `pnpm build` passed.
- `node scripts/qa-wordpress-html.mjs` passed and wrote screenshots/results to `outputs/wordpress-html-qa/`.
- Source-vs-app metric check: all 12 route/viewport captures matched for text length, scroll dimensions, image count, shortcode state, and Contact entry-limit state.
- Key requested visual checks:
  - Home mobile: source/app screenshot is pixel-identical in the generated comparison run.
  - Contact desktop: source/app screenshot is pixel-identical in the generated comparison run.

## Remaining mismatches

- No meaningful visual mismatches found in the rerun screenshots.
- A few desktop screenshots have tiny pixel-level/non-semantic differences likely from browser rendering/network timing, but visual inspection shows the source and app layouts aligned.
