# Elevate Frontend FAQ Accordion Fix — 2026-05-11

## Result
Done.

## Root cause
The FAQ accordions lived in the static WordPress HTML output, not the React runtime. The build injector was still treating same-page FAQ `href="#collapse..."` links like normal navigation and reloading/navigating back to the same route, which reset the accordion state.

## Fix
- Added native accordion support to the static HTML build injector in `scripts/build-wordpress-html.mjs`.
- Added direct header binding for `.elementskit-accordion .elementskit-card-header`.
- Toggled `.active`, `.collapsed`, `.show`, and `aria-expanded`/`aria-hidden` state inline.
- Ignored same-page hash navigation so accordion clicks no longer get hijacked.
- Kept the existing mobile/menu behavior intact.

## Verification
- `pnpm build` ✅
- Synthetic click QA on `/about/`, `/career-services/`, `/educational-services/` at 390px and 1440px ✅
- Accordion open/close toggles work on the pages that contain FAQ accordions ✅
- No page errors or console errors in QA ✅

## Notes
- `/`, `/diy-products/`, and `/contact-us/` do not contain FAQ accordions in the current static export, so they correctly had nothing to toggle.
