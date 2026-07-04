-- Elevate Career Hub lead system: leads, nurture campaign, purchases,
-- scholarships feed. Lives in Supabase so a Hostinger redeploy (which wipes
-- public_html) can never lose data again.
--
-- IMPORTANT: this Supabase project is SHARED with another Elevate app (users,
-- job_kits, mock_sessions, its own `purchases` table, etc.). Every object here
-- is therefore prefixed `ech_` and lives in `public` so it co-tenants safely
-- without colliding with, or being visible to, that app's tables.
--
-- Access model: the PHP endpoints call PostgREST/Storage with the service key
-- (SUPABASE_SERVICE_KEY in ech-config.php). Anon/authenticated roles get
-- nothing: RLS is enabled with no policies and function EXECUTE is revoked.

-- ── Leads ────────────────────────────────────────────────────────────────
-- One row per quiz submission. Collapses the old split between the raw lead
-- (leads-YYYY-MM.ndjson) and the campaign enrollment (lead-campaigns.ndjson).
-- uid is the legacy "gsm-..." campaign id and MUST keep its format: it is
-- embedded in unsubscribe links inside already-sent emails.
create table public.ech_leads (
  id bigint generated always as identity primary key,
  uid text not null,
  created_at timestamptz not null default now(),
  ip text not null default '',
  ua text not null default '',
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  phone_normalized text not null default '',
  consent boolean not null default false,
  linkedin text not null default '',
  portfolio text not null default '',
  answers jsonb not null default '{}'::jsonb,
  pathway_ids jsonb not null default '[]'::jsonb,
  scholarship_ids jsonb not null default '[]'::jsonb,
  pathways jsonb not null default '[]'::jsonb,
  scholarships jsonb not null default '[]'::jsonb,
  cv_file text not null default '',
  cv_meta jsonb not null default '{}'::jsonb,
  suspected_bot boolean not null default false,
  campaign_enrolled boolean not null default false,
  source text not null default 'grad_school_match',
  status text not null default 'new'
    check (status in ('new','contacted','interested','converted','lost')),
  status_updated_at timestamptz
);

alter table public.ech_leads add constraint uq_ech_leads_uid unique (uid);
-- Phone dedup (replaces api/_data/phone-index.json). Partial: legacy imports
-- may carry empty/degenerate phones and those must not collide.
create unique index uq_ech_leads_phone on public.ech_leads (phone_normalized)
  where phone_normalized <> '' and phone_normalized <> '+';
create index ix_ech_leads_email on public.ech_leads (email);
create index ix_ech_leads_created on public.ech_leads (created_at desc);
create index ix_ech_leads_status on public.ech_leads (status);

-- ── Lead notes (admin CRM) ───────────────────────────────────────────────
create table public.ech_lead_notes (
  id bigint generated always as identity primary key,
  lead_id bigint not null references public.ech_leads(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index ix_ech_notes_lead on public.ech_lead_notes (lead_id);

-- ── Campaign sends ───────────────────────────────────────────────────────
-- Replaces lead-campaign-sent.json. The UNIQUE key is the idempotency guard:
-- a step can never be sent twice, even across concurrent runners.
-- status 'skipped' records the slow-lane e6/e7 no-template case.
create table public.ech_campaign_sends (
  id bigint generated always as identity primary key,
  lead_id bigint not null references public.ech_leads(id) on delete cascade,
  step text not null check (step in ('e1','e2','e3','e4','e5','e6','e7')),
  status text not null default 'sent' check (status in ('sent','skipped')),
  sent_at timestamptz not null default now(),
  constraint uq_ech_send unique (lead_id, step)
);
create index ix_ech_sends_step on public.ech_campaign_sends (step);
create index ix_ech_sends_sent_at on public.ech_campaign_sends (sent_at desc);

-- ── Campaign suppressions ────────────────────────────────────────────────
-- Replaces lead-campaign-suppressed.json. Emails are stored lowercased.
create table public.ech_campaign_suppressions (
  email text primary key,
  reason text not null default 'unsubscribe',
  created_at timestamptz not null default now()
);

-- ── Purchases (Paystack-verified ledger) ─────────────────────────────────
-- Replaces purchases-YYYY-MM.ndjson. Distinct from the other app's public
-- `purchases` table. UNIQUE reference makes re-verification idempotent.
create table public.ech_purchases (
  id bigint generated always as identity primary key,
  reference text not null,
  service_id text not null default '',
  item_name text not null default '',
  type text not null default '',
  amount_pesewas integer not null default 0,
  currency text not null default 'GHS',
  buyer_name text not null default '',
  buyer_email text not null default '',
  sessions jsonb not null default '[]'::jsonb,
  paystack_status text not null default '',
  created_at timestamptz not null default now()
);
alter table public.ech_purchases add constraint uq_ech_purchase_ref unique (reference);
create index ix_ech_purch_email on public.ech_purchases (buyer_email);
create index ix_ech_purch_created on public.ech_purchases (created_at desc);

-- ── Scholarships runtime feed (admin-managed) ────────────────────────────
-- Replaces api/_data/scholarships.json. Shapes match ech_scholarship_clean().
create table public.ech_scholarships (
  id text primary key,
  name text not null,
  region text not null default 'Multiple',
  funding_type text not null default '',
  blurb text not null default '',
  regions jsonb not null default '["any"]'::jsonb,
  fields jsonb not null default '["any"]'::jsonb,
  degrees jsonb not null default '["any"]'::jsonb,
  funding jsonb not null default '["flexible"]'::jsonb,
  min_class text not null default '2:1',
  ideal_exp text not null default 'any',
  tags jsonb not null default '[]'::jsonb,
  weight integer not null default 50,
  gender_eligibility text not null default 'any',
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ── App settings (small k/v: scholarships_updated_at, legacy_import_done_at) ─
create table public.ech_app_settings (
  k text primary key,
  v text,
  updated_at timestamptz not null default now()
);

-- ── RLS: deny-all for anon/authenticated; service key bypasses ───────────
alter table public.ech_leads enable row level security;
alter table public.ech_lead_notes enable row level security;
alter table public.ech_campaign_sends enable row level security;
alter table public.ech_campaign_suppressions enable row level security;
alter table public.ech_purchases enable row level security;
alter table public.ech_scholarships enable row level security;
alter table public.ech_app_settings enable row level security;

-- ── Private CV bucket (storage.objects RLS has no policies → anon denied) ─
insert into storage.buckets (id, name, public)
values ('ech-cvs', 'ech-cvs', false)
on conflict (id) do nothing;

-- ── RPC: leads eligible for the nurture campaign ─────────────────────────
-- Pushes the runner's skip logic into SQL: enrolled, not a bot, has an email,
-- not suppressed, and not already a bootcamp buyer (auto-suppression).
create or replace function public.ech_campaign_due_leads()
returns setof public.ech_leads
language sql
security definer
set search_path = public
as $$
  select l.*
  from public.ech_leads l
  where l.campaign_enrolled
    and not l.suspected_bot
    and l.email <> ''
    and not exists (
      select 1 from public.ech_campaign_suppressions s where s.email = l.email
    )
    and not exists (
      select 1 from public.ech_purchases p
      where p.buyer_email = l.email
        and (p.service_id ilike 'bootcamp-grad%' or p.item_name ilike '%grad school bootcamp%')
    )
  order by l.created_at asc
$$;

-- ── RPC: admin lead list with per-row meta + total ───────────────────────
create or replace function public.ech_leads_with_meta(
  q text default '',
  status_filter text default '',
  lim integer default 50,
  off integer default 0
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select l.*
    from public.ech_leads l
    where (status_filter = '' or l.status = status_filter)
      and (
        q = ''
        or l.name ilike '%' || q || '%'
        or l.email ilike '%' || q || '%'
        or l.phone ilike '%' || q || '%'
        or l.phone_normalized ilike '%' || q || '%'
        or (l.answers ->> 'reason') ilike '%' || q || '%'
      )
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce((
      select jsonb_agg(row_json)
      from (
        select to_jsonb(f) || jsonb_build_object(
          'notes_count', (select count(*) from public.ech_lead_notes n where n.lead_id = f.id),
          'last_step', (
            select s.step from public.ech_campaign_sends s
            where s.lead_id = f.id and s.status = 'sent'
            order by s.sent_at desc limit 1
          ),
          'suppressed', exists (
            select 1 from public.ech_campaign_suppressions cs where cs.email = f.email
          ),
          'converted', exists (
            select 1 from public.ech_purchases p
            where p.buyer_email = f.email and p.created_at >= f.created_at
          )
        ) as row_json
        from filtered f
        order by f.created_at desc
        limit lim offset off
      ) page
    ), '[]'::jsonb)
  )
$$;

-- ── RPC: overview dashboard stats ────────────────────────────────────────
create or replace function public.ech_stats_overview()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'leadsTotal', (select count(*) from public.ech_leads),
    'leadsRealTotal', (select count(*) from public.ech_leads where not suspected_bot),
    'leadsByStatus', coalesce((
      select jsonb_object_agg(status, c)
      from (select status, count(*) c from public.ech_leads group by status) s
    ), '{}'::jsonb),
    'leadsOverTime', coalesce((
      select jsonb_agg(jsonb_build_object('d', d, 'c', c) order by d)
      from (
        select to_char(date(created_at), 'YYYY-MM-DD') d, count(*) c
        from public.ech_leads
        where created_at >= now() - interval '90 days'
        group by 1
      ) t
    ), '[]'::jsonb),
    'enrolled', (
      select count(*) from public.ech_leads where campaign_enrolled and not suspected_bot
    ),
    'convertedLeads', (
      select count(distinct l.id)
      from public.ech_leads l
      join public.ech_purchases p on p.buyer_email = l.email and p.created_at >= l.created_at
    ),
    'revenueFromLeadsPesewas', coalesce((
      select sum(p.amount_pesewas)
      from public.ech_purchases p
      where exists (
        select 1 from public.ech_leads l
        where l.email = p.buyer_email and l.created_at <= p.created_at
      )
    ), 0),
    'funnel', coalesce((
      select jsonb_object_agg(step, c)
      from (
        select step, count(*) c from public.ech_campaign_sends
        where status = 'sent' group by step
      ) f
    ), '{}'::jsonb),
    'suppressions', coalesce((
      select jsonb_object_agg(reason, c)
      from (select reason, count(*) c from public.ech_campaign_suppressions group by reason) sup
    ), '{}'::jsonb),
    'purchasesTotal', (select count(*) from public.ech_purchases),
    'revenueTotalPesewas', coalesce((select sum(amount_pesewas) from public.ech_purchases), 0)
  )
$$;

-- ── RPC: atomic scholarship feed replace ─────────────────────────────────
-- REST has no transactions across calls; this keeps delete+insert atomic so a
-- failed import can never leave the public quiz with an empty feed.
create or replace function public.ech_scholarships_replace(items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted integer;
begin
  delete from public.ech_scholarships where true; -- Supabase blocks unqualified DELETE
  insert into public.ech_scholarships (
    id, name, region, funding_type, blurb, regions, fields, degrees, funding,
    min_class, ideal_exp, tags, weight, gender_eligibility, active, sort_order
  )
  select
    x ->> 'id',
    x ->> 'name',
    coalesce(x ->> 'region', 'Multiple'),
    coalesce(x ->> 'fundingType', ''),
    coalesce(x ->> 'blurb', ''),
    coalesce(x -> 'regions', '["any"]'::jsonb),
    coalesce(x -> 'fields', '["any"]'::jsonb),
    coalesce(x -> 'degrees', '["any"]'::jsonb),
    coalesce(x -> 'funding', '["flexible"]'::jsonb),
    coalesce(x ->> 'minClass', '2:1'),
    coalesce(x ->> 'idealExp', 'any'),
    coalesce(x -> 'tags', '[]'::jsonb),
    coalesce((x ->> 'weight')::integer, 50),
    coalesce(x ->> 'genderEligibility', 'any'),
    coalesce((x ->> 'active')::boolean, true),
    (row_number() over ()) - 1
  from jsonb_array_elements(items) x;
  get diagnostics inserted = row_count;
  insert into public.ech_app_settings (k, v, updated_at)
  values ('scholarships_updated_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"+00:00"'), now())
  on conflict (k) do update set v = excluded.v, updated_at = now();
  return inserted;
end
$$;

-- ── Lock the RPCs down: service key only ─────────────────────────────────
revoke all on function public.ech_campaign_due_leads() from public, anon, authenticated;
revoke all on function public.ech_leads_with_meta(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.ech_stats_overview() from public, anon, authenticated;
revoke all on function public.ech_scholarships_replace(jsonb) from public, anon, authenticated;
grant execute on function public.ech_campaign_due_leads() to service_role;
grant execute on function public.ech_leads_with_meta(text, text, integer, integer) to service_role;
grant execute on function public.ech_stats_overview() to service_role;
grant execute on function public.ech_scholarships_replace(jsonb) to service_role;
