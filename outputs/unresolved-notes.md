# Unresolved Assets, Forms, Pages, and QA Notes

## Assets

The migration downloaded 348 WordPress upload assets. The live WordPress site also references several upload URLs that currently return `404 Not Found`; these were not invented or replaced. See `migration-issues.json` for the full machine-readable list.

Known missing source references include:

- `Asset-13.png`
- `Asset-14.png`
- `shape_Asset-6.png`
- `portrait-of-mid-adult-businesswoman-smiling-agains-5F3S7X7.jpg`
- `composite-collage-of-happy-diverse-multicultural-y2/y3/y4/y5-G8UCHFH.jpg`

## Forms and commerce behavior

- Static contact/social/WhatsApp/email links were preserved.
- WordPress/plugin script execution is intentionally stripped or neutralized for the static launch build.
- Internal WooCommerce cart, checkout, account, shop, and manage-profile flows are not MVP launch flows. `/shop/`, `/cart/`, `/checkout/`, `/my-account/`, and `/manage-profile/` now redirect to `/contact-us/` for assisted commerce.
- DIY product purchase intent is handled through WhatsApp/email CTAs or migrated product-content shells; no live cart, checkout, account login, downloads, or payment processing is exposed by this frontend MVP.
- Full ecommerce remains a future backend/commerce integration decision.

## Pages

35 public pages/posts/products were migrated from WordPress REST + rendered HTML. Six priority routes are emitted from local WordPress HTML source exports. The remaining non-commerce migrated routes are emitted as direct static app-shell routes that load sanitized snapshots. Commerce/account shell routes redirect to `/contact-us/`. See `outputs/route-launch-classification-20260510.md` for the launch decision for every migrated route.

## QA completed on 2026-05-10

- `pnpm build` passed.
- `pnpm run audit` passed with documented source-site warnings.
- `node scripts/qa-wordpress-html.mjs` passed for the six priority pages across mobile390 and desktop1440 with 0 failed app requests and 0 page errors.
- `node scripts/smoke-direct-routes.mjs` passed for all 35 migrated routes.
