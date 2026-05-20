# Elevate Career Hub Frontend Migration

Modern Vite + React + TypeScript rebuild of `https://elevatecareerhub.com/` that preserves the existing WordPress site structure, copy, links, visual assets, Elementor markup, and public route set as closely as possible.

## What is included

- React/Vite SPA shell with same-route navigation and legacy `/index.php/...` alias support.
- 35 migrated public WordPress pages/posts/products.
- Vendored WordPress/Elementor CSS needed for visual parity.
- 348 downloaded upload assets under `public/assets/wp-content/uploads/...`.
- Per-page HTML snapshots under `public/snapshots/` to preserve source copy and Elementor layout.
- Route, link, asset, issue, and audit inventories under `outputs/`.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm run crawl   # refresh snapshots/assets from live WordPress site
pnpm run audit   # verify route/link/asset/snapshot inventory integrity
```

## Project structure

```text
src/main.tsx                 React route shell and internal link handling
src/generated/pages.json     Route manifest and per-page metadata
src/generated/vendor-css.css Vendored CSS imports
public/snapshots/            Captured page HTML snapshots
public/assets/               Downloaded WordPress upload assets
public/vendor/elevate-css/   Vendored WordPress/Elementor CSS files
scripts/crawl-wordpress.mjs  WordPress REST + HTML crawler
scripts/audit.mjs            Migration integrity audit
outputs/                     Route/link/asset/issues/audit deliverables
```

## Verification run

Last verified with:

```bash
pnpm build
pnpm run audit
pnpm preview --host 127.0.0.1 --port 4173
```

Build passed. Audit passed with warnings for source-site WooCommerce/account/product shells that have short HTML snapshots or missing source meta descriptions.

## Known limitations

- Browser-level visual regression screenshots were not completed in this run because no browser automation tool was available in the execution environment.
- WordPress scripts were stripped from migrated snapshots for safety and performance; static visual content, links, menus, and WhatsApp/email anchors are preserved. Dynamic WooCommerce/account/cart/checkout behavior remains an integration point.
- Some CSS font/icon URLs remain remote because they are referenced inside third-party WordPress plugin CSS.
- A small set of source WordPress upload references returned 404 and are documented in `outputs/migration-issues.json`.
