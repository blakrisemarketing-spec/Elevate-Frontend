# Direct Route Smoke Check — 2026-05-10

Generated: 2026-06-13T00:46:36.731Z

Command: `node scripts/smoke-direct-routes.mjs`

Result: PASS (35/35 passed)

| Route | Expected behavior | HTTP status | Result |
|---|---|---:|---|
| `/` | direct 200 static/app-shell route | 200 | PASS |
| `/about/` | direct 200 static/app-shell route | 200 | PASS |
| `/blog/` | direct 200 static/app-shell route | 200 | PASS |
| `/career-services/` | direct 200 static/app-shell route | 200 | PASS |
| `/career-strategy-session/` | direct 200 static/app-shell route | 200 | PASS |
| `/cart/` | intentional assisted-commerce redirect shell to /contact-us/ | 200 | PASS |
| `/checkout/` | intentional assisted-commerce redirect shell to /contact-us/ | 200 | PASS |
| `/contact-us/` | direct 200 static/app-shell route | 200 | PASS |
| `/cover-letter/` | direct 200 static/app-shell route | 200 | PASS |
| `/curriculum-vitae/` | direct 200 static/app-shell route | 200 | PASS |
| `/diy-products/` | direct 200 static/app-shell route | 200 | PASS |
| `/educational-services/` | direct 200 static/app-shell route | 200 | PASS |
| `/faqs/` | direct 200 static/app-shell route | 200 | PASS |
| `/how-our-career-development-company-can-help-you-stand-out/` | direct 200 static/app-shell route | 200 | PASS |
| `/how-to-boost-your-career-with-professional-resume-writing/` | direct 200 static/app-shell route | 200 | PASS |
| `/interview-preparation-session/` | direct 200 static/app-shell route | 200 | PASS |
| `/job-readiness-bootcamp/` | direct 200 static/app-shell route | 200 | PASS |
| `/jrb-thank-you/` | direct 200 static/app-shell route | 200 | PASS |
| `/lets-keep-in-touch/` | direct 200 static/app-shell route | 200 | PASS |
| `/linkedin-optimization/` | direct 200 static/app-shell route | 200 | PASS |
| `/manage-profile/` | intentional assisted-commerce redirect shell to /contact-us/ | 200 | PASS |
| `/my-account/` | intentional assisted-commerce redirect shell to /contact-us/ | 200 | PASS |
| `/product/becoming-a-job-magnet-on-linkedin/` | direct 200 static/app-shell route | 200 | PASS |
| `/product/complete-grad-school-bundle/` | direct 200 static/app-shell route | 200 | PASS |
| `/product/how-to-write-the-resume-that-lands-the-interview/` | direct 200 static/app-shell route | 200 | PASS |
| `/product/mastering-the-art-of-job-hunting-in-the-uk-as-an-international-student/` | direct 200 static/app-shell route | 200 | PASS |
| `/product/nailing-your-job-interviews/` | direct 200 static/app-shell route | 200 | PASS |
| `/product/remote-job-playbook/` | direct 200 static/app-shell route | 200 | PASS |
| `/product/the-complete-job-search-bundle/` | direct 200 static/app-shell route | 200 | PASS |
| `/reference-letter/` | direct 200 static/app-shell route | 200 | PASS |
| `/shop/` | intentional assisted-commerce redirect shell to /contact-us/ | 200 | PASS |
| `/statement-of-purpose/` | direct 200 static/app-shell route | 200 | PASS |
| `/suggestion-of-schools/` | direct 200 static/app-shell route | 200 | PASS |
| `/the-importance-of-professional-documents-in-career-development/` | direct 200 static/app-shell route | 200 | PASS |
| `/tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application/` | direct 200 static/app-shell route | 200 | PASS |
