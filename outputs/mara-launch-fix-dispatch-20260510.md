# Mara Launch Fix Dispatch — Elevate Frontend — 2026-05-10

## PM decision

**Decision: NOT LAUNCH READY.**

The current launch-readiness score is **5.5 / 10**. Elevate Frontend must not launch publicly until a fresh independent re-review scores the app **>= 9 / 10** with **zero P0 launch blockers**.

This is a trust product. A visitor is deciding whether to trust Elevate with their career, application, scholarship, or graduate-school future. Broken contact conversion, visible broken images, empty titles, missing H1s, failed plugin requests, and unproven deep links are not acceptable launch conditions.

## Launch target

Reach **>= 9 / 10 launch readiness** by closing only the blockers that affect public trust, conversion, accessibility, SEO basics, deployment reliability, and QA truthfulness.

Nice-to-have visual modernization is deferred. The immediate goal is a clean, reliable, conversion-safe MVP frontend.

---

## MVP launch scope decisions

### 1. Route scope

**In scope for MVP launch:**
- `/`
- `/about/`
- `/career-services/`
- `/educational-services/`
- `/diy-products/`
- `/contact-us/`
- Any currently linked blog, post, service, product, or legal/static route that appears in `src/generated/pages.json`, the navigation, sitemap, or internal links.

**Rule:** No public internal link may lead to a 404, broken shell, raw shortcode, quota message, or unresolved WooCommerce state.

### 2. Deep-link strategy

**Decision:** Every route in the migrated 35-route manifest must be either:
1. served directly as a static route with a correct `index.html`, or
2. covered by an explicit deployment rewrite/fallback that returns the app and renders correct content, or
3. intentionally redirected to a launch-safe destination.

Cart/checkout/account-style routes that are not launch-ready must not pretend to be working. They should redirect to `/diy-products/` or `/contact-us/` with a clean assisted-purchase path.

### 3. Commerce/product checkout strategy

**Decision:** Do **not** launch internal WooCommerce cart, checkout, or account flows in this frontend MVP.

MVP commerce is **assisted commerce**:
- DIY product/product cards use clear CTAs such as **“Message us on WhatsApp to purchase”** or **“Ask about this product”**.
- Product CTAs open WhatsApp with a prefilled product/service inquiry where feasible.
- Email fallback remains available.
- Internal Add to Cart, Checkout, My Account, and broken WooCommerce plugin flows are removed, hidden, redirected, or replaced with safe explanatory copy.

If the live legacy WordPress checkout is intentionally used later, it must be separately verified end-to-end before being linked. It is not part of this blocker pass.

### 4. Contact strategy

**Decision:** The Contact page must show a deliberate static fallback block unless a fully working form is implemented and verified.

Minimum acceptable MVP contact conversion:
- Primary CTA: WhatsApp `https://wa.me/233531113454`
- Secondary CTA: `mailto:elevatewithnll@gmail.com`
- Clear expectation-setting copy: what users can ask for and response expectation.
- No visible Fluent Forms quota state.
- No metadata or share snippet containing “Maximum number of entries exceeded.”

---

## Prioritized fix plan by workstream

### Workstream A — Conversion rescue: Contact and assisted commerce

**Priority:** P0  
**Primary owner:** Devon  
**Supporting owners:** Nova, Iris  
**Related task spec:** `elevate-frontend-20260510-002-spec.md`

#### Problem
The Contact page exposes **“Maximum number of entries exceeded.”** in body and metadata. This is the primary conversion path and currently communicates operational failure.

DIY Products also carries unresolved WooCommerce behavior and JavaScript errors. Commerce must be simplified into a launch-safe assisted path.

#### Product direction
Replace broken form/plugin output with a controlled static contact/assisted-commerce experience. Do not ship cart/checkout/account behavior.

#### Acceptance criteria
- `/contact-us/` never displays “Maximum number of entries exceeded.” at any checked viewport.
- Contact metadata, OG metadata, and Twitter metadata are clean and conversion-safe.
- Contact page shows a clear WhatsApp-first contact block and email fallback.
- DIY Product CTAs do not trigger broken WooCommerce/cart/checkout/account behavior.
- Product or service purchase intent routes to WhatsApp/email or a verified external destination only.
- Internal cart/checkout/account links are removed, hidden, or redirected to safe launch pages.
- No plugin script error remains on `/diy-products/`.

#### Verification
- Browser QA at 360/390/430/768/1024/1440 confirms no quota text and clear CTAs.
- Link audit confirms WhatsApp/email links are valid.
- Console/page-error check on `/diy-products/` reports zero errors.
- Metadata check confirms Contact description no longer contains error text.

---

### Workstream B — Trust visuals: broken image repair and responsive overflow

**Priority:** P0  
**Primary owner:** Sanaa  
**Supporting owners:** Devon  
**Related task spec:** `elevate-frontend-20260510-003-spec.md`

#### Problem
Fresh QA found **49 broken visible image instances** across six priority routes and horizontal overflow on Home at 360/768 and About at 768. Broken visuals erode trust immediately.

#### Product direction
Repair visible trust-bearing images where assets exist. Remove or replace decorative assets that cannot be reliably served. Fix overflow without broad redesign.

#### Acceptance criteria
- 0 visible broken images across priority routes at 390 and 1440 in the main QA script.
- 0 visible broken images across priority routes at 360/390/430/768/1024/1440 in the extra viewport check.
- Home has no horizontal overflow at 360 or 768.
- About has no horizontal overflow at 768.
- No layout fix hides critical service, price, CTA, testimonial, or contact content.
- Mobile navigation and CTAs remain usable.

#### Verification
- Fresh browser screenshots reviewed for six priority routes.
- `node scripts/qa-wordpress-html.mjs` reports 0 broken visible images.
- Extra viewport check reports `overflowX: false` on all priority route/viewport combinations.

---

### Workstream C — SEO/accessibility basics: titles, H1s, metadata, alt posture

**Priority:** P0/P1  
**Primary owner:** Nova  
**Supporting owners:** Devon, Sanaa  
**Related task spec:** `elevate-frontend-20260510-004-spec.md`

#### Problem
All six priority routes have empty browser titles. Five of six have no H1. Metadata is thin and Contact metadata repeats the form quota failure. This fails basic trust, SEO, and accessibility expectations.

#### Product direction
Add plain, specific, brand-consistent titles, H1s, and meta descriptions for launch-critical pages. Do not over-rewrite the site. This is a surgical clarity pass.

#### Required copy package
Use or improve this baseline:

| Route | Title | H1 | Meta description |
|---|---|---|---|
| `/` | Elevate Career Hub — Career & Education Support in Ghana | Complete Hub for Career and Education Success | Elevate Career Hub helps students, graduates, and professionals strengthen applications, CVs, interviews, and education plans with practical expert support. |
| `/about/` | About Elevate Career Hub | Helping Ambitious People Move Forward With Confidence | Learn how Elevate Career Hub supports career growth and education goals through practical guidance, trusted resources, and personalized services. |
| `/career-services/` | Career Services — CVs, Cover Letters, LinkedIn & Interview Prep | Career Services That Help You Stand Out | Get expert support with CV writing, cover letters, LinkedIn optimization, interview preparation, and career bundles tailored to your goals. |
| `/educational-services/` | Educational Services — Graduate School & Scholarship Support | Education Support for Stronger Applications | Prepare stronger graduate school and scholarship applications with support for CVs, essays, school selection, references, and interviews. |
| `/diy-products/` | DIY Career & Education Products — Elevate Career Hub | Practical DIY Resources for Your Next Step | Explore Elevate Career Hub DIY resources for career and education planning, then message us for purchase support or guidance. |
| `/contact-us/` | Contact Elevate Career Hub | Talk to Elevate Career Hub | Message Elevate Career Hub on WhatsApp or email us for help with CVs, applications, interviews, scholarships, and education planning. |

#### Acceptance criteria
- Every priority route has a non-empty `<title>` and `document.title`.
- Every priority route has one clear page-level H1, or a documented exception approved by Mara.
- Contact metadata contains no error/quota text.
- Meta descriptions are specific, human-readable, and non-empty.
- Canonical, OG title/description, and Twitter title/description are present for priority routes.
- Image alt text is improved for meaningful images; decorative images may remain empty only where appropriate.

#### Verification
- QA assertions pass for non-empty title and H1 on every priority route.
- Metadata check validates title, description, canonical, OG, and Twitter fields.
- Manual review confirms copy sounds like Elevate: warm, professional, practical, not generic SaaS filler.

---

### Workstream D — System reliability: remote dependency cleanup and deployment/deep links

**Priority:** P0/P1  
**Primary owner:** Iris  
**Supporting owners:** Devon  
**Related task spec:** `elevate-frontend-20260510-005-spec.md`

#### Problem
QA records **102 failed app requests**, mostly remote WordPress/plugin fonts, plus no deployment config for full route fallback. A launch frontend cannot repeatedly call broken legacy assets or leave deep-link behavior to chance.

#### Product direction
Neutralize old plugin dependencies and prove deployment routing. Keep only assets and scripts required for the static MVP experience.

#### Acceptance criteria
- 0 failed app requests in browser QA for priority routes.
- 0 page errors in browser QA.
- No required asset loads from old `https://elevatecareerhub.com/wp-content/plugins/...` plugin/font paths.
- A host-appropriate deployment config exists, or static route generation covers direct deep links.
- All 35 migrated routes are classified as serve, redirect, or out-of-scope-hidden.
- Direct URL smoke checks for launch routes return 200 or intentional redirect.
- Cart/checkout/account routes do not expose broken dynamic shells.

#### Verification
- Browser QA network failure count is 0 for app-controlled requests.
- Direct route smoke test covers all launch-included routes.
- Deployment config/rewrite behavior is documented in the completion report.

---

### Workstream E — QA truth gate and re-review readiness

**Priority:** P0  
**Primary owner:** Kofi  
**Supporting owners:** Devon, Sanaa, Iris, Nova  
**Related task spec:** `elevate-frontend-20260510-006-spec.md`

#### Problem
The QA script exits 0 while recording launch-blocking defects. This can falsely certify a broken public site.

#### Product direction
Make QA fail loudly on launch blockers and produce a clean re-review evidence pack.

#### Acceptance criteria
`node scripts/qa-wordpress-html.mjs` exits non-zero for any of:
- visible broken images > 0
- failed app requests > 0, excluding explicitly documented external non-critical requests if approved
- page errors > 0
- horizontal overflow on required viewports
- visible “Maximum number of entries exceeded.”
- raw shortcodes or form quota messages
- empty browser titles
- missing page-level H1s

Also add or preserve checks for:
- priority route HTTP status
- usable navigation
- contact CTAs visible and valid
- metadata present
- screenshot output for manual inspection

#### Verification
- Before fixes, the hardened gate would fail on the known defects.
- After fixes, `pnpm build`, `pnpm run audit`, and `node scripts/qa-wordpress-html.mjs` all pass.
- Re-review package includes screenshots, QA JSON, route smoke results, and a concise defect-zero summary.

---

## Verification gates before re-review

The app is eligible for a fresh launch-readiness re-review only after all gates pass.

### Gate 1 — Build and static audit

```bash
pnpm build
pnpm run audit
```

Required result:
- Both commands pass.
- Warnings are either resolved or documented as non-launch-blocking.

### Gate 2 — Hardened browser QA

```bash
node scripts/qa-wordpress-html.mjs
```

Required result:
- Exit code 0 only when there are zero launch-blocking defects.
- QA JSON records 0 visible broken images, 0 page errors, 0 visible contact quota text, 0 empty titles, 0 missing H1s, and 0 horizontal overflow on required viewports.

### Gate 3 — Extra viewport smoke check

Required widths:
- 360
- 390
- 430
- 768
- 1024
- 1440

Required routes:
- `/`
- `/about/`
- `/career-services/`
- `/educational-services/`
- `/diy-products/`
- `/contact-us/`

Required result:
- No horizontal overflow.
- Contact CTAs visible.
- No broken visible image indicators.
- Mobile navigation usable.

### Gate 4 — Metadata/accessibility smoke check

Required result on each priority route:
- Non-empty `document.title`.
- One clear page-level H1, unless documented and approved.
- Non-empty meta description.
- Canonical present.
- OG/Twitter title and description present.
- Contact page metadata clean.
- Basic keyboard navigation through menu and CTAs works.

### Gate 5 — Route/deployment smoke check

Required result:
- Every route in `src/generated/pages.json` is classified.
- Public launch routes return 200 by direct URL or intentional redirect.
- Removed commerce/account routes redirect safely.
- Deployment rewrite/static strategy is documented.

### Gate 6 — PM re-review

Mara or an independent launch-readiness reviewer reruns the launch rubric.

Required result:
- Score **>= 9 / 10**.
- No P0 blockers.
- Any remaining issues are explicitly P2/non-blocking.

---

## Exact next dispatch order

1. **Nova / Mara copy package is already embedded in this dispatch**; Devon may use it immediately. If Nova is available, she should quickly validate copy in `elevate-frontend-20260510-004-spec.md` before implementation.
2. **Devon — `elevate-frontend-20260510-002-spec.md`**: Contact conversion and assisted-commerce cleanup. This removes the most damaging conversion blocker.
3. **Sanaa + Devon — `elevate-frontend-20260510-003-spec.md`**: Broken visible images and responsive overflow. This repairs trust visuals.
4. **Nova + Devon + Sanaa — `elevate-frontend-20260510-004-spec.md`**: Titles, H1s, metadata, and accessibility copy. This can run partly in parallel after the contact direction is clear.
5. **Iris + Devon — `elevate-frontend-20260510-005-spec.md`**: Remote dependency cleanup, deployment rewrites, and route classification. This can run in parallel with visual/copy fixes, but must merge carefully.
6. **Kofi — `elevate-frontend-20260510-006-spec.md`**: Harden QA gates after the implementation branches land, then produce the clean evidence pack.
7. **Independent re-review**: rerun launch-readiness scoring. Launch remains blocked until score is >=9/10.

## What is explicitly deferred

- Full modern React/Tailwind rebuild of all WordPress-export pages.
- A/B testing implementation.
- Analytics event architecture beyond preserving clean CTA paths.
- Native cart/checkout/account implementation.
- Broad brand redesign beyond launch-blocking trust and clarity repairs.

These are valuable, but they are not the fastest path from 5.5 to >=9. The team fixes launch blockers first.
