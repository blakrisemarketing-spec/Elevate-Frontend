# Elevate Career Hub — Frontend (project memory)

Modern **Vite + React + TypeScript** rebuild of the WordPress site `elevatecareerhub.com`, deployed on **Hostinger**. Repo: `blakrisemarketing-spec/Elevate-Frontend`.

> Machine-local **`elevate-*` skills** carry the deep detail (architecture, payments, deployment, design, open work). This file is the always-loaded summary + pointers. **This is NOT the BetterHealth Africa project** — do not apply `bh-*` skills or assume a Node/Supabase backend here.

## Mental model: two rendering systems
1. **7 priority routes = static SSG, ZERO client JS** — `/`, `/about/`, `/career-services/`, `/educational-services/`, `/diy-products/`, `/contact-us/`, `/payment/confirmed/`. Built by `scripts/build-priority-routes.mjs` (react-dom/server + inlined Tailwind CSS). **LCP ~0.6s on Regular 3G.** Components in `src/priority/`.
2. **~29 non-priority routes = WordPress-snapshot SPA** via `src/main.tsx` (loads `public/snapshots/*.html`). Not redesigned; loads the Vite bundle. Migrating these is the next big lift.

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
Go-live: live Paystack keys · confirm env reaches PHP runtime (else `api/config.php`) · verify Tosend sender domain. Gaps: 5 DIY products lack deliverable files · 29 non-priority routes unmigrated · no CI/tests · dead netlify/vercel configs.

## Changelog (commit hashes)
- `a53d751` — initial SSG redesign (system fonts), 20s→420ms on 3G.
- `7f6c5eb` — ship-readiness (pinned deps, SEO, security headers).
- `0cfb008` — Figma redesign + Paystack payments + co-founder hero + brand.
- `751185a` — switch build to npm (fix Hostinger corepack/pnpm crash). **Current main.**
