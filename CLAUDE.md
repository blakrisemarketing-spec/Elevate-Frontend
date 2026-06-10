# Elevate Career Hub — Frontend (project memory)

Modern **Vite + React + TypeScript** rebuild of the WordPress site `elevatecareerhub.com`, deployed on **Hostinger**. Repo: `blakrisemarketing-spec/Elevate-Frontend`.

> Machine-local **`elevate-*` skills** carry the deep detail (architecture, payments, deployment, design, open work). This file is the always-loaded summary + pointers. **This is NOT the BetterHealth Africa project** — do not apply `bh-*` skills or assume a Node/Supabase backend here.

## Mental model: two rendering systems
1. **All content routes = static SSG, ZERO client JS** — built by `scripts/build-priority-routes.mjs` (react-dom/server + inlined Tailwind CSS), **LCP ~0.3–0.4s on Regular 3G**. Components in `src/priority/`. Static pages are listed in `PRIORITY_ROUTES`; the product/service/blog **detail** pages are data-driven — content in `src/priority/data/{products,services,blog}.ts`, rendered by the `ProductDetail`/`ServiceDetail`/`BlogPost` templates, with routes generated from that data (mirrored in `src/priority/registry.ts`). Detail pages with a catalog SKU ship the checkout island (`hasCheckout`).
2. **WordPress-snapshot SPA (`src/main.tsx`) is now vestigial.** Every content route has a `PRIORITY_PAGES` entry, so snapshots in `public/snapshots/*.html` are no longer rendered for any route (the 5 commerce shells `/cart/` etc. are `.htaccess` 302s → `/contact-us/`). The SPA + its vendor CSS bundle can be fully removed as an optional cleanup (see `docs/route-migration-plan.md`, Phase 5).

`src/main.tsx` imports `src/priority/registry.ts`, so `npm run dev` shows the redesigned pages with HMR. Checkout + PHP do NOT run under `npm run dev`.

## Stack
Vite 8 · React 19 · TypeScript 6 · Tailwind v3 · esbuild 0.28 · **npm (NOT pnpm)** · Node 20. Headings: `"Gilroy ExtraBold"` font, currently **Montserrat 800 stand-in** (Gilroy is commercial/absent). Body: system sans. Payments: **Paystack inline + PHP verify + Tosend email**.

## Commands
- `npm run dev` — design iteration (5173, HMR). No checkout/PHP.
- `npm run build` — full build → `dist/` (tsc → vite → WP-html → tailwind → SSG/island/api/.htaccess).
- `npm run serve:php` — local full-stack preview (port 8080, `php -S` over `dist/`, loads `.env.local`). Use for checkout/PHP.
- `npm run bench -- /` — Regular-3G LCP benchmark · `npm run audit` · `node scripts/smoke-direct-routes.mjs`.

## Hard-won gotchas
- **Build is npm, not pnpm.** Hostinger's corepack crashes on pnpm (`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`); the `packageManager: pnpm@…` pin was ignored. `packageManager: npm@10.9.3`, `package-lock.json`, no `pnpm-lock.yaml`/`pnpm-workspace.yaml`.
- **PHP runs on the Hostinger Vite pipeline** (confirmed: `GET /api/verify-payment.php` → 405).
- **Never put the Paystack secret key in the client.** Verify server-side + check amount against `src/checkout/catalog.ts` (the price source of truth). Secrets live in env / gitignored `api/config.php` + `.env.local` (never committed).
- **Keep priority pages zero-JS.** Checkout loads only on pages flagged `hasCheckout` in `build-priority-routes.mjs`. Don't add hydration.

## Env vars
Build: `VITE_PAYSTACK_PUBLIC_KEY`. Runtime PHP: `PAYSTACK_SECRET_KEY`, `TOSEND_API_KEY`, `MAIL_FROM`, `OPS_EMAIL`, `PUBLIC_APP_BASE_URL`. See `.env.example`.

## Open work (see elevate-tech-debt-registry for detail)
Go-live: live Paystack keys · confirm env reaches PHP runtime (else `api/config.php`) · verify Tosend sender domain · create the `hello@elevatecareerhub.com` mailbox · legal-review the policy pages. Gaps: 5 DIY products lack deliverable files · Gilroy still a Montserrat stand-in · optional: rip out the now-vestigial SPA + vendor CSS (Phase 5). **Done this branch:** legal/404/staging-noindex, CI, all 24 snapshot routes migrated to SSG.

## Changelog (commit hashes)
- `a53d751` — initial SSG redesign (system fonts), 20s→420ms on 3G.
- `7f6c5eb` — ship-readiness (pinned deps, SEO, security headers).
- `0cfb008` — Figma redesign + Paystack payments + co-founder hero + brand.
- `751185a` — switch build to npm (fix Hostinger corepack/pnpm crash).
- _this branch_ — go-live hardening (legal pages, real 404, staging noindex, social/email, CI, dead-config removal) + full route migration: all 24 WordPress-snapshot routes → data-driven zero-JS SSG.
