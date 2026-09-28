# Elevate Career Hub Frontend

Static, zero-JS rebuild of `https://elevatecareerhub.com/`, deployed on Hostinger. Every route is pre-rendered to HTML at build time from React components; only pages that need it load a small island (checkout, Grad School Match, admin). Payments run through Paystack with server-side PHP verification. See `CLAUDE.md` for the full project notes.

## Commands

```bash
npm install
npm run dev        # design iteration with HMR (no checkout/PHP)
npm run build      # full production build -> dist/
npm run audit      # post-build: links, assets, scripts, fingerprinting
npm run smoke      # post-build: every route serves 200 with content
npm run serve:php  # local full-stack preview on :8080 (checkout + PHP)
npm run bench -- / # Regular-3G LCP benchmark
```

## Project structure

```text
src/priority/                    Page components, templates and content data
src/priority/registry.ts         Route -> component map (dev server)
src/checkout/, src/match/, src/admin/   Client islands
src/main.tsx                     Dev-only preview entry (not shipped)
scripts/build-priority-routes.mjs  The production build: SSG, islands, api/, .htaccess
api/                             PHP endpoints (payments, leads, admin)
deploy/htaccess.conf             Hostinger headers, redirects, caching
public/                          Static files copied into dist/
supabase/migrations/             Runtime data schema
```

## Caching

Images and fonts are cached for a year. The build copies every image/font a page references to `name.<hash>.ext` and points the page at that copy, so replacing a file in `public/` always reaches visitors on the next deploy. HTML is served with `Cache-Control: no-cache`.
