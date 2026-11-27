-- 2027 platform: growth dashboard, ops engine, client portal.
-- See docs/2027-platform-plan.md.
--
-- Same access model as 001-004: every object is `ech_`-prefixed, RLS is
-- enabled with NO policies (deny-all for anon/authenticated) and only the PHP
-- service key reaches it. Functions are SECURITY DEFINER with EXECUTE revoked
-- from public/anon/authenticated and granted to service_role only.
--
-- Idempotent where practical (if not exists / or replace) so a partial apply
-- can be re-run.

-- ── Admin roles ──────────────────────────────────────────────────────────
-- founder: everything incl. users · partner: everything except user admin ·
-- staff: assigned client work only (no finance).
alter table public.ech_admin_users drop constraint if exists ech_admin_users_role_check;
update public.ech_admin_users set role = 'founder' where role = 'admin';
alter table public.ech_admin_users alter column role set default 'staff';
alter table public.ech_admin_users add constraint ech_admin_users_role_check
  check (role in ('founder', 'partner', 'staff'));

-- ── Channel + category helpers ───────────────────────────────────────────
-- One place that turns raw attribution into a reporting channel, so leads,
-- checkout purchases and the dashboard all agree.
create or replace function public.ech_channel(
  utm_source text, utm_medium text, referrer text
) returns text
language sql immutable
set search_path = public
as $$
  select case
    when coalesce(utm_source, '') = '' and coalesce(referrer, '') = '' then 'direct'
    when lower(utm_source) ~ '(facebook|^fb$|^ig$|instagram|meta)' then 'meta'
    when lower(utm_source) ~ 'tiktok' then 'tiktok'
    when lower(utm_source) ~ 'linkedin' then 'linkedin'
    when lower(utm_source) ~ '(whatsapp|^wa$)' then 'whatsapp'
    when lower(utm_source) ~ '(google|adwords|gads)' and lower(coalesce(utm_medium, '')) ~ '(cpc|ppc|paid|ads)' then 'google_ads'
    when lower(utm_source) ~ '(email|newsletter|tosend|mailchimp)' or lower(coalesce(utm_medium, '')) = 'email' then 'email'
    when lower(utm_source) ~ '(twitter|^x$|x\.com)' then 'x'
    when lower(utm_source) ~ 'youtube' then 'youtube'
    when coalesce(utm_source, '') <> '' then 'other'
    when lower(referrer) ~ '(google\.|bing\.|duckduckgo|yahoo\.|chatgpt|perplexity)' then 'organic_search'
    when lower(referrer) ~ '(facebook\.com|instagram\.com|fb\.me|l\.facebook)' then 'meta'
    when lower(referrer) ~ 'linkedin\.com' then 'linkedin'
    when lower(referrer) ~ 'tiktok\.com' then 'tiktok'
    when lower(referrer) ~ '(t\.co|twitter\.com|x\.com)' then 'x'
    when lower(referrer) ~ '(wa\.me|whatsapp)' then 'whatsapp'
    when lower(referrer) ~ 'elevatecareerhub\.com' then 'direct'
    else 'referral'
  end
$$;

-- Product category from the catalog id prefix (mirrors src/checkout/fulfilment.ts).
create or replace function public.ech_service_category(service_id text) returns text
language sql immutable
set search_path = public
as $$
  select case
    when service_id like 'career-%' then 'career_services'
    when service_id like 'bundle-%' then 'career_bundles'
    when service_id like 'edu-bundle-%' then 'grad_bundles'
    when service_id like 'edu-%' then 'grad_services'
    when service_id like 'diy-%' then 'diy_products'
    when service_id like 'bootcamp-%' then 'events'
    else 'other'
  end
$$;

-- ── Clients ──────────────────────────────────────────────────────────────
-- One row per paying (or portal-invited) person. Email is the identity key,
-- stored lowercased. Portal auth columns live here; password_hash '' = unset.
create table if not exists public.ech_clients (
  id bigint generated always as identity primary key,
  email text not null unique,
  name text not null default '',
  phone text not null default '',
  acquisition_channel text not null default 'direct',
  first_purchase_at timestamptz,
  notes text not null default '',
  password_hash text not null default '',
  google_sub text unique,
  portal_enabled boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_ech_clients_created on public.ech_clients (created_at desc);
create index if not exists ix_ech_clients_channel on public.ech_clients (acquisition_channel);

-- ── Purchases: attribution + client link ─────────────────────────────────
alter table public.ech_purchases
  add column if not exists client_id bigint references public.ech_clients(id) on delete set null,
  add column if not exists utm_source text not null default '',
  add column if not exists utm_medium text not null default '',
  add column if not exists utm_campaign text not null default '',
  add column if not exists utm_term text not null default '',
  add column if not exists utm_content text not null default '',
  add column if not exists referrer text not null default '',
  add column if not exists landing_path text not null default '',
  add column if not exists channel text not null default '';
create index if not exists ix_ech_purch_client on public.ech_purchases (client_id);

-- Derive the reporting channel on insert. Checkout sends first-party
-- attribution (UTM / external referrer); when that says 'direct', fall back to
-- the buyer's most recent quiz lead, which often carries the ad UTM.
create or replace function public.ech_purchases_set_channel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v text;
begin
  if coalesce(new.channel, '') <> '' then
    return new;
  end if;
  v := public.ech_channel(new.utm_source, new.utm_medium, new.referrer);
  if v = 'direct' and coalesce(new.buyer_email, '') <> '' then
    select public.ech_channel(l.utm_source, l.utm_medium, l.referrer) into v
    from public.ech_leads l
    where lower(l.email) = lower(new.buyer_email)
    order by l.created_at desc limit 1;
    v := coalesce(nullif(v, ''), 'direct');
  end if;
  new.channel := v;
  return new;
end
$$;
revoke all on function public.ech_purchases_set_channel() from public, anon, authenticated;
drop trigger if exists trg_ech_purchases_channel on public.ech_purchases;
create trigger trg_ech_purchases_channel
  before insert on public.ech_purchases
  for each row execute function public.ech_purchases_set_channel();

-- ── Offline sales (MoMo / bank / cash / WhatsApp-closed deals) ───────────
create table if not exists public.ech_offline_sales (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  client_id bigint not null references public.ech_clients(id) on delete restrict,
  service_id text not null default '',
  item_name text not null default '',
  amount_pesewas integer not null check (amount_pesewas > 0),
  method text not null default 'momo' check (method in ('momo', 'bank', 'cash', 'card', 'other')),
  channel text not null default 'direct',
  reference text not null default '',
  notes text not null default '',
  recorded_by text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists ix_ech_offline_occurred on public.ech_offline_sales (occurred_at desc);
create index if not exists ix_ech_offline_client on public.ech_offline_sales (client_id);

-- ── Marketing spend ──────────────────────────────────────────────────────
create table if not exists public.ech_marketing_spend (
  id bigint generated always as identity primary key,
  spent_on date not null,
  channel text not null,
  campaign text not null default '',
  amount_pesewas integer not null check (amount_pesewas > 0),
  notes text not null default '',
  recorded_by text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists ix_ech_spend_date on public.ech_marketing_spend (spent_on desc);

-- ── Goals ────────────────────────────────────────────────────────────────
-- period = 'YYYY' (annual) or 'YYYY-MM' (monthly override).
create table if not exists public.ech_goals (
  period text primary key check (period ~ '^\d{4}(-(0[1-9]|1[0-2]))?$'),
  revenue_target_pesewas bigint not null default 0 check (revenue_target_pesewas >= 0),
  clients_target integer check (clients_target is null or clients_target >= 0),
  updated_at timestamptz not null default now()
);
insert into public.ech_goals (period, revenue_target_pesewas)
values ('2027', 100000000)  -- GH₵1,000,000
on conflict (period) do nothing;

-- ── Unified revenue view (Paystack + offline) ────────────────────────────
create or replace view public.ech_revenue_v as
  select
    'ps:' || p.reference as id,
    'paystack'::text as source,
    'paystack'::text as method,
    p.created_at as occurred_at,
    p.client_id,
    p.buyer_email as email,
    p.service_id,
    p.item_name,
    public.ech_service_category(p.service_id) as category,
    p.amount_pesewas,
    coalesce(nullif(p.channel, ''), 'direct') as channel
  from public.ech_purchases p
  union all
  select
    'off:' || o.id,
    'offline',
    o.method,
    o.occurred_at,
    o.client_id,
    c.email,
    o.service_id,
    o.item_name,
    public.ech_service_category(o.service_id),
    o.amount_pesewas,
    o.channel
  from public.ech_offline_sales o
  join public.ech_clients c on c.id = o.client_id;
-- Views run with the owner's rights; keep them unreachable for anon/auth.
revoke all on public.ech_revenue_v from public, anon, authenticated;

-- ── Engagements (one tracked piece of client work) ───────────────────────
create table if not exists public.ech_engagements (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.ech_clients(id) on delete cascade,
  source_kind text not null default 'manual' check (source_kind in ('paystack', 'offline', 'manual')),
  source_ref text not null default '',
  component_key text not null default '',
  service_id text not null default '',
  family text not null default 'custom',
  title text not null,
  status text not null default 'intake'
    check (status in ('intake', 'in_progress', 'client_review', 'revisions', 'delivered', 'closed', 'on_hold')),
  owner_id bigint references public.ech_admin_users(id) on delete set null,
  due_on date,
  client_message text not null default '',
  started_at timestamptz,
  delivered_at timestamptz,
  closed_at timestamptz,
  status_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Idempotency guard: a purchase can never spawn the same work item twice.
-- Manual engagements get a random source_ref so they never collide. A full
-- (non-partial) constraint because PostgREST on_conflict needs one.
alter table public.ech_engagements drop constraint if exists uq_ech_engagement_source;
alter table public.ech_engagements add constraint uq_ech_engagement_source
  unique (source_kind, source_ref, component_key);
create index if not exists ix_ech_eng_client on public.ech_engagements (client_id);
create index if not exists ix_ech_eng_owner on public.ech_engagements (owner_id);
create index if not exists ix_ech_eng_status on public.ech_engagements (status);

create table if not exists public.ech_engagement_steps (
  id bigint generated always as identity primary key,
  engagement_id bigint not null references public.ech_engagements(id) on delete cascade,
  position integer not null default 0,
  label text not null,
  done boolean not null default false,
  done_at timestamptz,
  done_by text not null default ''
);
create index if not exists ix_ech_steps_eng on public.ech_engagement_steps (engagement_id, position);

-- ── Deliverables (files in the private `ech-deliverables` bucket) ────────
create table if not exists public.ech_deliverables (
  id bigint generated always as identity primary key,
  engagement_id bigint not null references public.ech_engagements(id) on delete cascade,
  client_id bigint not null references public.ech_clients(id) on delete cascade,
  title text not null default '',
  object_path text not null unique,
  file_name text not null default '',
  mime text not null default 'application/octet-stream',
  size_bytes integer not null default 0,
  version integer not null default 1,
  client_visible boolean not null default false,
  uploaded_by text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists ix_ech_deliv_eng on public.ech_deliverables (engagement_id);
create index if not exists ix_ech_deliv_client on public.ech_deliverables (client_id);

insert into storage.buckets (id, name, public)
values ('ech-deliverables', 'ech-deliverables', false)
on conflict (id) do nothing;

-- ── Applications (grad school + job search tracker, client-visible) ──────
create table if not exists public.ech_applications (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.ech_clients(id) on delete cascade,
  engagement_id bigint references public.ech_engagements(id) on delete set null,
  kind text not null check (kind in ('school', 'job')),
  organization text not null,
  title text not null default '',
  location text not null default '',
  url text not null default '',
  deadline date,
  status text not null default 'shortlisted'
    check (status in (
      'shortlisted', 'preparing', 'submitted', 'interview', 'offer', 'waitlisted', 'rejected', 'accepted', 'withdrawn',
      'found', 'applied'
    )),
  client_notes text not null default '',
  internal_notes text not null default '',
  status_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_ech_apps_client on public.ech_applications (client_id);

-- ── Activity (append-only audit + client-visible timeline) ───────────────
create table if not exists public.ech_activity (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor text not null default 'system',
  actor_name text not null default '',
  client_id bigint references public.ech_clients(id) on delete cascade,
  engagement_id bigint references public.ech_engagements(id) on delete set null,
  kind text not null,
  summary text not null default '',
  client_visible boolean not null default false,
  meta jsonb not null default '{}'::jsonb
);
create index if not exists ix_ech_activity_created on public.ech_activity (created_at desc);
create index if not exists ix_ech_activity_client on public.ech_activity (client_id, created_at desc);

-- ── Portal one-time tokens (set / reset password) ────────────────────────
create table if not exists public.ech_portal_tokens (
  token_hash text primary key,
  client_id bigint not null references public.ech_clients(id) on delete cascade,
  purpose text not null default 'set_password' check (purpose in ('set_password')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ix_ech_tokens_client on public.ech_portal_tokens (client_id);

-- ── RLS: deny-all ────────────────────────────────────────────────────────
alter table public.ech_clients enable row level security;
alter table public.ech_offline_sales enable row level security;
alter table public.ech_marketing_spend enable row level security;
alter table public.ech_goals enable row level security;
alter table public.ech_engagements enable row level security;
alter table public.ech_engagement_steps enable row level security;
alter table public.ech_deliverables enable row level security;
alter table public.ech_applications enable row level security;
alter table public.ech_activity enable row level security;
alter table public.ech_portal_tokens enable row level security;

-- ── Backfill: clients from existing purchases ────────────────────────────
-- Name = most recent non-empty buyer_name. Channel = the most recent quiz lead
-- (same email) before their first purchase, else 'direct'.
insert into public.ech_clients (email, name, first_purchase_at, acquisition_channel, created_at)
select
  e.email,
  coalesce((
    select p2.buyer_name from public.ech_purchases p2
    where lower(p2.buyer_email) = e.email and p2.buyer_name <> ''
    order by p2.created_at desc limit 1
  ), ''),
  e.first_at,
  coalesce((
    select public.ech_channel(l.utm_source, l.utm_medium, l.referrer)
    from public.ech_leads l
    where lower(l.email) = e.email and l.created_at <= e.first_at
    order by l.created_at desc limit 1
  ), 'direct'),
  e.first_at
from (
  select lower(trim(buyer_email)) as email, min(created_at) as first_at
  from public.ech_purchases
  where trim(buyer_email) <> ''
  group by lower(trim(buyer_email))
) e
on conflict (email) do nothing;

update public.ech_purchases p
set client_id = c.id
from public.ech_clients c
where p.client_id is null and lower(trim(p.buyer_email)) = c.email;

update public.ech_purchases p
set channel = coalesce((
  select public.ech_channel(l.utm_source, l.utm_medium, l.referrer)
  from public.ech_leads l
  where lower(l.email) = lower(p.buyer_email) and l.created_at <= p.created_at
  order by l.created_at desc limit 1
), 'direct')
where p.channel = '';

-- ── Growth dashboard stats ───────────────────────────────────────────────
-- One round trip for the whole Growth tab. Year is calendar (Ghana = UTC).
create or replace function public.ech_growth_stats(p_year integer)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with
  yr as (
    select make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC') as y0,
           make_timestamptz(p_year + 1, 1, 1, 0, 0, 0, 'UTC') as y1
  ),
  rev as (
    select r.* from public.ech_revenue_v r, yr
    where r.occurred_at >= yr.y0 and r.occurred_at < yr.y1
  ),
  rev_prev as (
    select r.* from public.ech_revenue_v r, yr
    where r.occurred_at >= yr.y0 - interval '1 year' and r.occurred_at < yr.y0
  ),
  -- First-ever order per client (across all time) decides "new client" month.
  first_order as (
    select client_id, min(occurred_at) as first_at
    from public.ech_revenue_v where client_id is not null
    group by client_id
  ),
  new_clients as (
    select f.client_id, f.first_at, c.acquisition_channel as channel
    from first_order f
    join public.ech_clients c on c.id = f.client_id, yr
    where f.first_at >= yr.y0 and f.first_at < yr.y1
  ),
  spend as (
    select s.* from public.ech_marketing_spend s
    where extract(year from s.spent_on) = p_year
  ),
  months as (select generate_series(1, 12) as m),
  goal_year as (
    select revenue_target_pesewas, clients_target from public.ech_goals where period = p_year::text
  ),
  goal_month as (
    select m.m,
      coalesce(
        (select g.revenue_target_pesewas from public.ech_goals g where g.period = p_year::text || '-' || lpad(m.m::text, 2, '0')),
        round(coalesce((select revenue_target_pesewas from goal_year), 0) / 12.0)
      )::bigint as target
    from months m
  ),
  leads_y as (
    select l.* from public.ech_leads l, yr
    where l.created_at >= yr.y0 and l.created_at < yr.y1 and not l.suspected_bot
  ),
  ordered as (
    select client_id, service_id, item_name, occurred_at,
           lead(service_id) over (partition by client_id order by occurred_at) as next_service,
           lead(item_name) over (partition by client_id order by occurred_at) as next_item
    from public.ech_revenue_v where client_id is not null
  ),
  client_orders as (
    select client_id, count(*) as n from public.ech_revenue_v
    where client_id is not null group by client_id
  )
  select jsonb_build_object(
    'year', p_year,
    'goal', jsonb_build_object(
      'revenueTargetPesewas', coalesce((select revenue_target_pesewas from goal_year), 0),
      'clientsTarget', (select clients_target from goal_year),
      'monthly', (select jsonb_agg(target order by m) from goal_month)
    ),
    'totals', jsonb_build_object(
      'revenuePesewas', coalesce((select sum(amount_pesewas) from rev), 0),
      'orders', (select count(*) from rev),
      'paystackPesewas', coalesce((select sum(amount_pesewas) from rev where source = 'paystack'), 0),
      'offlinePesewas', coalesce((select sum(amount_pesewas) from rev where source = 'offline'), 0),
      'newClients', (select count(*) from new_clients),
      'activeClients', (select count(distinct client_id) from rev),
      'spendPesewas', coalesce((select sum(amount_pesewas) from spend), 0),
      'leads', (select count(*) from leads_y),
      'leadsConverted', (select count(*) from leads_y where status = 'converted'),
      'prevYearRevenuePesewas', coalesce((select sum(amount_pesewas) from rev_prev), 0),
      'repeatClients', (select count(*) from client_orders where n > 1),
      'clientsWithOrders', (select count(*) from client_orders)
    ),
    'monthly', (
      select jsonb_agg(jsonb_build_object(
        'm', mo.m,
        'revenue', coalesce((select sum(amount_pesewas) from rev where extract(month from occurred_at) = mo.m), 0),
        'paystack', coalesce((select sum(amount_pesewas) from rev where source = 'paystack' and extract(month from occurred_at) = mo.m), 0),
        'offline', coalesce((select sum(amount_pesewas) from rev where source = 'offline' and extract(month from occurred_at) = mo.m), 0),
        'orders', (select count(*) from rev where extract(month from occurred_at) = mo.m),
        'prevYear', coalesce((select sum(amount_pesewas) from rev_prev where extract(month from occurred_at) = mo.m), 0),
        'newClients', (select count(*) from new_clients where extract(month from first_at) = mo.m),
        'spend', coalesce((select sum(amount_pesewas) from spend where extract(month from spent_on) = mo.m), 0),
        'leads', (select count(*) from leads_y where extract(month from created_at) = mo.m),
        'target', (select target from goal_month g where g.m = mo.m)
      ) order by mo.m)
      from months mo
    ),
    'byCategory', coalesce((
      select jsonb_agg(jsonb_build_object('category', category, 'revenue', rv, 'orders', n) order by rv desc)
      from (select category, sum(amount_pesewas) rv, count(*) n from rev group by category) t
    ), '[]'::jsonb),
    'byProduct', coalesce((
      select jsonb_agg(jsonb_build_object('serviceId', service_id, 'name', item_name, 'category', category, 'revenue', rv, 'orders', n) order by rv desc)
      from (
        select service_id, max(item_name) item_name, max(category) category, sum(amount_pesewas) rv, count(*) n
        from rev group by service_id order by sum(amount_pesewas) desc limit 20
      ) t
    ), '[]'::jsonb),
    'byMethod', coalesce((
      select jsonb_agg(jsonb_build_object('method', method, 'revenue', rv, 'orders', n) order by rv desc)
      from (select method, sum(amount_pesewas) rv, count(*) n from rev group by method) t
    ), '[]'::jsonb),
    -- Channel economics: new clients acquired in the year by acquisition
    -- channel, the revenue those clients brought in during the year, and the
    -- spend logged against the channel. CAC/ROAS are derived client-side.
    'byChannel', coalesce((
      select jsonb_agg(jsonb_build_object(
        'channel', ch,
        'newClients', (select count(*) from new_clients nc where nc.channel = ch),
        'revenue', coalesce((
          select sum(r.amount_pesewas) from rev r
          join new_clients nc on nc.client_id = r.client_id
          where nc.channel = ch
        ), 0),
        'allRevenue', coalesce((
          select sum(r.amount_pesewas) from rev r
          join public.ech_clients c on c.id = r.client_id
          where c.acquisition_channel = ch
        ), 0),
        'spend', coalesce((select sum(amount_pesewas) from spend s where s.channel = ch), 0),
        'leads', (select count(*) from leads_y l where public.ech_channel(l.utm_source, l.utm_medium, l.referrer) = ch)
      ) order by ch)
      from (
        select channel ch from new_clients
        union select channel from spend
        union select c.acquisition_channel from rev r join public.ech_clients c on c.id = r.client_id
        union select public.ech_channel(utm_source, utm_medium, referrer) from leads_y
      ) chans
    ), '[]'::jsonb),
    'pairs', coalesce((
      select jsonb_agg(jsonb_build_object('from', item_name, 'to', next_item, 'count', n) order by n desc)
      from (
        select max(item_name) item_name, max(next_item) next_item, count(*) n
        from ordered where next_service is not null and next_service <> service_id
        group by service_id, next_service
        order by count(*) desc limit 10
      ) t
    ), '[]'::jsonb),
    'availableYears', coalesce((
      select jsonb_agg(y order by y desc) from (
        select distinct extract(year from occurred_at)::int y from public.ech_revenue_v
        union select p_year
      ) ys
    ), '[]'::jsonb)
  )
$$;

-- ── Ops board summary ────────────────────────────────────────────────────
create or replace function public.ech_ops_summary()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'byStatus', coalesce((
      select jsonb_object_agg(status, n) from (
        select status, count(*) n from public.ech_engagements group by status
      ) t
    ), '{}'::jsonb),
    'overdue', (
      select count(*) from public.ech_engagements
      where due_on < current_date and status not in ('delivered', 'closed')
    ),
    'unassigned', (
      select count(*) from public.ech_engagements
      where owner_id is null and status not in ('delivered', 'closed')
    ),
    'deliveredLast30', (
      select count(*) from public.ech_engagements where delivered_at >= now() - interval '30 days'
    ),
    'avgTurnaroundDays', (
      select round(avg(extract(epoch from (delivered_at - created_at)) / 86400)::numeric, 1)
      from public.ech_engagements where delivered_at is not null and delivered_at >= now() - interval '90 days'
    ),
    'byOwner', coalesce((
      select jsonb_agg(jsonb_build_object('ownerId', owner_id, 'name', name, 'open', open_n, 'overdue', overdue_n) order by open_n desc)
      from (
        select e.owner_id, coalesce(nullif(u.name, ''), u.email, 'Unassigned') name,
          count(*) filter (where e.status not in ('delivered', 'closed')) open_n,
          count(*) filter (where e.due_on < current_date and e.status not in ('delivered', 'closed')) overdue_n
        from public.ech_engagements e
        left join public.ech_admin_users u on u.id = e.owner_id
        group by e.owner_id, u.name, u.email
      ) t
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.ech_channel(text, text, text) from public, anon, authenticated;
revoke all on function public.ech_service_category(text) from public, anon, authenticated;
revoke all on function public.ech_growth_stats(integer) from public, anon, authenticated;
revoke all on function public.ech_ops_summary() from public, anon, authenticated;
grant execute on function public.ech_channel(text, text, text) to service_role;
grant execute on function public.ech_service_category(text) to service_role;
grant execute on function public.ech_growth_stats(integer) to service_role;
grant execute on function public.ech_ops_summary() to service_role;
grant select on public.ech_revenue_v to service_role;
