# Elevate 2027 platform plan

Goal: **GH₵1,000,000 revenue in 2027** (≈ GH₵83,300/month, ≈ GH₵19,200/week).
To get there the team needs three things it does not have today:

1. **Growth dashboard**: one source of truth for revenue, spend, acquisition and product mix.
2. **Ops engine**: every paid order becomes a tracked piece of work with an owner, steps, deadlines and deliverables.
3. **Client portal**: clients log in and see their own work, files and application statuses.

Everything builds on what already ships: Supabase (`ech_` tables, service key, RLS deny-all),
PHP endpoints on Hostinger, the React admin island at `/admin/`, Paystack verify, Tosend email.
No new hosting, no new vendor. Public content pages stay zero-JS; only the private
`/admin/` and `/portal/` apps ship JavaScript.

> **Status (Nov 2026): phases 1–3 are built** on branch `claude/2027-growth-infrastructure-f194cb`.
> Team task planning (growth, social, product) stays in **Notion** by decision; phase 4 below is
> reduced to the items that belong in this platform. See *Go-live checklist* at the end.

---

## What exists today (Nov 2026)

| Area | Today | Gap |
|---|---|---|
| Revenue | `ech_purchases` (Paystack only) + Purchases tab | No offline sales (MoMo, bank, cash), no goal pacing, no per-category view |
| Acquisition | UTM captured on **quiz leads** only; `sourceFunnel` stat | Checkout buyers carry no UTM; no spend data, so no CAC / ROAS |
| Clients | Leads CRM + Conversion board | No client record: a buyer is just an email on a purchase row |
| Delivery | Done in WhatsApp / email / Drive | Nothing tracked; founders cannot see what is pending |
| Team | Admin users (single `admin` role) | No roles, no assignment, no activity log |

---

## Data model (new Supabase tables)

```
ech_clients            one per person (email unique). Links leads + purchases.
ech_purchases          + utm_*/referrer/landing_path, + client_id, + channel
ech_offline_sales      MoMo / bank / cash sales entered by staff (same shape as purchases)
ech_marketing_spend    date, channel, campaign, amount_pesewas, notes
ech_goals              period (2027, 2027-01..12), revenue_target, clients_target

ech_engagements        one per service bought: client, service_id, status, owner, due_at
ech_engagement_steps   checklist generated from a per-service template
ech_deliverables       files in private Storage bucket `deliverables`, versioned, client_visible
ech_applications       kind = school | job. Institution/company, programme/role,
                       deadline, status, link, notes. Client-visible.
ech_activity           append-only: who did what, when (team + system events)
ech_team_tasks         (phase 4) growth / social / product / ops work items

ech_admin_users.role   founder | partner | staff   (replaces single 'admin')
ech_portal_tokens      one-time set/reset-password link tokens (sha256-hashed, single use)
```

Engagement status: `intake → in_progress → client_review → revisions → delivered → closed`
(plus `on_hold`). Application status (school): `shortlisted → preparing → submitted →
interview → offer | rejected | waitlisted → accepted`. Job: `found → applied → interview →
offer | rejected`.

Bundles expand into several engagements (e.g. Starter Bundle → CV + Cover Letter + LinkedIn),
driven by a `components` list per bundle in `catalog.ts`, so each piece is tracked separately.

---

## Phase 1: Growth dashboard (target: live before 1 Jan 2027)

The dashboard has to be measuring from day one of 2027, so it goes first.

- **Attribution on purchases**: checkout captures first-touch UTM / referrer / landing page
  (same pattern as the match tool) and sends it to `verify-payment.php`.
- **Clients table** backfilled from existing purchases + leads; repeat buyers become visible.
- **Offline sales entry** in admin, so MoMo/bank revenue counts toward the GH₵1M.
- **Marketing spend entry** (manual, per channel/month; Meta Ads import later).
- **Growth tab** in `/admin/`:
  - Goal pacing: YTD revenue vs GH₵1M, required run-rate for the rest of the year, month-by-month bars vs target
  - Revenue by category (Career, Grad School, DIY, Bootcamp) and by product, AOV, units
  - Acquisition: new clients per month by channel, CAC (spend ÷ new clients), ROAS (revenue ÷ spend)
  - Funnel: leads → clients by source, lead-to-purchase time
  - Repeat purchase rate, top bundles, "bought X then Y" pairs
  - Paystack vs offline split
- Finance views restricted to `founder` / `partner` roles.

## Phase 2: Ops engine (January 2027)

- Paid purchase (Paystack or offline) auto-creates engagement(s) + steps from the service template.
- **Work board**: kanban by status, filter by owner / service / overdue. Senior roles see all; staff see their own.
- **Client file**: all engagements, deliverables, applications, notes, activity for one client.
- Upload deliverables (CV, cover letter, SOP drafts) to private Storage; mark version client-visible.
- Grad school + job-search **application tracker** per client.
- SLA timers: "due in 3 days", "overdue", "waiting on client" so nothing stalls silently.
- Activity log on every status change, upload, assignment.

## Phase 3: Client portal (February 2027)

- `/portal/` login with **Google** (verified email must match a client) or **email + password**
  (set through a one-time emailed link; the same link flow handles resets).
- Client sees: their services and current stage, step checklist, downloadable deliverables,
  school / job applications with status and deadlines, and a way to request revisions.
- Email notification when a deliverable is ready or an application status changes.
- Post-purchase email links straight into the portal.

## Phase 4: Later (2027)

- Growth, social, product and ops planning stays in Notion (decided Nov 2026).
- Meta Ads spend import (Meta Ads MCP / API) to replace manual spend entry.
- Weekly review email to founders: revenue vs pace, work delivered, overdue items.
- Team performance: turnaround per service, revisions per engagement, load per staff member
  (the Work board summary already shows open / overdue per owner and 90-day average turnaround).

---

## Roles

| Role | Growth / finance | All client work | Assign work | Manage users |
|---|---|---|---|---|
| founder | ✓ | ✓ | ✓ | ✓ |
| partner (senior exec) | ✓ | ✓ | ✓ | |
| staff | | own assignments | | |

The existing break-glass `ADMIN_PASSWORD` login stays as founder.

## Security notes

- Client portal and admin use separate PHP session cookies and separate auth code paths.
- Every portal query is scoped server-side by the session's `client_id`; no client ID is ever taken from the request.
- Deliverables are served through a PHP proxy that checks ownership, never by public URL.
- Portal sessions: stateless HMAC-signed cookie (`ech_portal`, HttpOnly, SameSite=Lax, 30 days),
  bound to a credential fingerprint, so a password change signs out every other device.
- Set/reset tokens: random 32 bytes, stored sha256-hashed, single use (atomic consume), 7 days for
  the post-purchase invite, 1 hour for resets; carried in the URL **fragment** (`/portal/#token=`)
  so they never reach server logs or analytics.
- Portal POSTs are JSON-only and Origin-checked. `/admin/` and `/portal/` ship no GTM / Meta Pixel.
- Staff role: API-enforced. Only their assigned work and those clients; no revenue anywhere;
  cannot reassign, delete, sync or create clients. Role / active flag re-checked every 5 minutes.

---

## What got built (map)

| Piece | Where |
|---|---|
| Schema, backfill, stats RPCs, channel trigger | `supabase/migrations/005_platform_2027.sql` |
| Work templates per service (bundles → components → steps) | `src/checkout/fulfilment.ts` → `dist/api/fulfilment.json` |
| Domain layer | `api/ops-store.php` |
| Admin endpoints | `api/admin-{growth,finance,clients,work,deliverables}.php` (+ roles in `admin-users.php`) |
| Portal endpoints | `api/portal-{auth,login,logout,password,google,me,file,message}.php` |
| Admin UI | `src/admin/tabs/{Growth,Finance,Work,Clients}Tab.tsx`, `ClientDrawer.tsx` |
| Portal UI | `src/portal/portal-client.tsx`, shell `src/priority/pages/Portal.tsx` |
| Checkout attribution | `src/analytics/attribution.ts` + `.htaccess` UTM/referrer cookies (zero page JS) |

Purchase flow now: Paystack verify → purchase row (channel derived by trigger, falling back to the
buyer's quiz-lead UTM) → client record → work items with steps and due dates → buyer email carries a
one-time portal setup link. Offline sales entered in **Sales & spend** do the same.

## Go-live checklist

1. **Apply the migration** `005_platform_2027.sql` to the Elevate Supabase project (SQL editor or
   CLI). It backfills clients from existing purchases and turns existing admins into `founder`.
2. **Set runtime env** in `ech-config.php`: `PORTAL_SESSION_SECRET`, `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET` (Google Cloud → OAuth client, redirect URI
   `https://elevatecareerhub.com/api/portal-google.php`).
3. **Deploy** (merge to `main`). Confirm `GET /api/portal-me.php` → 401 and `/portal/` loads.
4. In admin: **Users** → give each teammate a role. **Work board → Sync purchases** once to pull in
   recent Paystack orders. **Sales & spend** → enter 2027 offline sales and ad spend as they happen.
5. **Tag every ad link** with `utm_source` / `utm_medium` / `utm_campaign`, or the sale lands in
   "Direct / unknown" on the channel table.

