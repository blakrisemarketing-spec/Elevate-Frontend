# Elevate Frontend Route Launch Classification — 2026-05-10

Generated: 2026-06-10T19:14:42.911Z

| Route | Type | Launch behavior | Target | Decision reason |
|---|---|---|---|---|
| `/` | pages | serve-static | `/` | Priority launch route emitted as a direct WordPress source-of-truth static index.html. |
| `/about/` | pages | serve-static | `/about/` | Priority launch route emitted as a direct WordPress source-of-truth static index.html. |
| `/blog/` | pages | rewrite-to-app | `/blog/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/career-services/` | pages | serve-static | `/career-services/` | Priority launch route emitted as a direct WordPress source-of-truth static index.html. |
| `/career-strategy-session/` | pages | rewrite-to-app | `/career-strategy-session/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/cart/` | pages | redirect-to-safe-route | `/contact-us/` | Internal WooCommerce/account flow is not in MVP; route is redirected to assisted WhatsApp/email contact. |
| `/checkout/` | pages | redirect-to-safe-route | `/contact-us/` | Internal WooCommerce/account flow is not in MVP; route is redirected to assisted WhatsApp/email contact. |
| `/contact-us/` | pages | serve-static | `/contact-us/` | Priority launch route emitted as a direct WordPress source-of-truth static index.html. |
| `/cover-letter/` | pages | rewrite-to-app | `/cover-letter/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/curriculum-vitae/` | pages | rewrite-to-app | `/curriculum-vitae/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/diy-products/` | pages | serve-static | `/diy-products/` | Priority launch route emitted as a direct WordPress source-of-truth static index.html. |
| `/educational-services/` | pages | serve-static | `/educational-services/` | Priority launch route emitted as a direct WordPress source-of-truth static index.html. |
| `/faqs/` | pages | rewrite-to-app | `/faqs/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/how-our-career-development-company-can-help-you-stand-out/` | posts | rewrite-to-app | `/how-our-career-development-company-can-help-you-stand-out/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/how-to-boost-your-career-with-professional-resume-writing/` | posts | rewrite-to-app | `/how-to-boost-your-career-with-professional-resume-writing/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/interview-preparation-session/` | pages | rewrite-to-app | `/interview-preparation-session/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/job-readiness-bootcamp/` | pages | rewrite-to-app | `/job-readiness-bootcamp/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/jrb-thank-you/` | pages | rewrite-to-app | `/jrb-thank-you/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/lets-keep-in-touch/` | pages | rewrite-to-app | `/lets-keep-in-touch/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/linkedin-optimization/` | pages | rewrite-to-app | `/linkedin-optimization/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/manage-profile/` | pages | redirect-to-safe-route | `/contact-us/` | Internal WooCommerce/account flow is not in MVP; route is redirected to assisted WhatsApp/email contact. |
| `/my-account/` | pages | redirect-to-safe-route | `/contact-us/` | Internal WooCommerce/account flow is not in MVP; route is redirected to assisted WhatsApp/email contact. |
| `/product/becoming-a-job-magnet-on-linkedin/` | product | rewrite-to-app | `/product/becoming-a-job-magnet-on-linkedin/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/product/complete-grad-school-bundle/` | product | rewrite-to-app | `/product/complete-grad-school-bundle/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/product/how-to-write-the-resume-that-lands-the-interview/` | product | rewrite-to-app | `/product/how-to-write-the-resume-that-lands-the-interview/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/product/mastering-the-art-of-job-hunting-in-the-uk-as-an-international-student/` | product | rewrite-to-app | `/product/mastering-the-art-of-job-hunting-in-the-uk-as-an-international-student/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/product/nailing-your-job-interviews/` | product | rewrite-to-app | `/product/nailing-your-job-interviews/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/product/remote-job-playbook/` | product | rewrite-to-app | `/product/remote-job-playbook/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/product/the-complete-job-search-bundle/` | product | rewrite-to-app | `/product/the-complete-job-search-bundle/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/reference-letter/` | pages | rewrite-to-app | `/reference-letter/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/shop/` | pages | redirect-to-safe-route | `/contact-us/` | Internal WooCommerce/account flow is not in MVP; route is redirected to assisted WhatsApp/email contact. |
| `/statement-of-purpose/` | pages | rewrite-to-app | `/statement-of-purpose/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/suggestion-of-schools/` | pages | rewrite-to-app | `/suggestion-of-schools/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/the-importance-of-professional-documents-in-career-development/` | posts | rewrite-to-app | `/the-importance-of-professional-documents-in-career-development/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |
| `/tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application/` | posts | rewrite-to-app | `/tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application/` | Migrated route served by a direct static React shell index.html that loads the matching sanitized snapshot. |

Commerce/account rule: `/cart/`, `/checkout/`, `/my-account/`, `/shop/`, and `/manage-profile/` are not public MVP flows. They redirect to `/contact-us/` for assisted commerce.