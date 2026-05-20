# WordPress HTML Route Map

Source of truth for six priority launch pages: local files under `Wordpress Files/` and matching `*_files/` asset folders.

Build hook: `pnpm build` runs Vite first, then `scripts/build-wordpress-html.mjs`:

1. Keeps the Vite React shell for migrated non-priority routes.
2. Overwrites the six priority launch routes with local WordPress HTML exports.
3. Emits direct `index.html` files for all 35 routes in `src/generated/pages.json` so static hosts can serve deep links without relying on an unknown provider rewrite.
4. Emits `/cart/`, `/checkout/`, `/my-account/`, `/shop/`, and `/manage-profile/` as assisted-commerce redirect shells to `/contact-us/`.
5. Writes `dist/_redirects` as a conservative static-host fallback for hosts that support Netlify/Cloudflare Pages-style redirects.

| App route | Source HTML | Source assets | Built output |
|---|---|---|---|
| `/` | `Wordpress Files/Home.html` | `Wordpress Files/Home_files/` | `dist/index.html` + `dist/Home_files/` |
| `/about/` | `Wordpress Files/About.html` | `Wordpress Files/About_files/` | `dist/about/index.html` + `dist/about/About_files/` |
| `/career-services/` | `Wordpress Files/Career-services.html` | `Wordpress Files/Career-services_files/` | `dist/career-services/index.html` + `dist/career-services/Career-services_files/` |
| `/educational-services/` | `Wordpress Files/Education-services.html` | `Wordpress Files/Education-services_files/` | `dist/educational-services/index.html` + `dist/educational-services/Education-services_files/` |
| `/diy-products/` | `Wordpress Files/DIY-Products.html` | `Wordpress Files/DIY-Products_files/` | `dist/diy-products/index.html` + `dist/diy-products/DIY-Products_files/` |
| `/contact-us/` | `Wordpress Files/Contact.html` | `Wordpress Files/Contact_files/` | `dist/contact-us/index.html` + `dist/contact-us/Contact_files/` |

All route launch decisions are documented in `outputs/route-launch-classification-20260510.md` and `outputs/route-launch-classification-20260510.json`.
