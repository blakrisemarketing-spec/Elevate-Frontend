-- Scalable admin tools: attribution (UTM/source), segment broadcasts, and
-- saved lead views. All objects stay `ech_`-prefixed (shared Supabase project).

-- ── Attribution on leads ─────────────────────────────────────────────────
alter table public.ech_leads
  add column if not exists utm_source   text not null default '',
  add column if not exists utm_medium   text not null default '',
  add column if not exists utm_campaign text not null default '',
  add column if not exists utm_term     text not null default '',
  add column if not exists utm_content  text not null default '',
  add column if not exists referrer     text not null default '',
  add column if not exists landing_path text not null default '';

create index if not exists ix_ech_leads_source on public.ech_leads (utm_source);

-- ── Segment broadcasts (one-off email blasts, audit log) ─────────────────
create table if not exists public.ech_broadcasts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  subject text not null default '',
  body_html text not null default '',
  filter jsonb not null default '{}'::jsonb,     -- {q, status} segment criteria
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  skipped_count integer not null default 0,
  status text not null default 'sent' check (status in ('sent','partial','failed'))
);
create index if not exists ix_ech_broadcasts_created on public.ech_broadcasts (created_at desc);

-- ── Saved lead views (shared across the admin team) ──────────────────────
create table if not exists public.ech_saved_views (
  id bigint generated always as identity primary key,
  name text not null unique,
  filter jsonb not null default '{}'::jsonb,     -- {q, status}
  created_at timestamptz not null default now()
);

alter table public.ech_broadcasts enable row level security;
alter table public.ech_saved_views enable row level security;

-- ── Extend the dashboard stats with source attribution ───────────────────
-- source = utm_source, or 'direct' when absent. Adds:
--   leadsBySource   {source: count}
--   sourceFunnel    [{source, leads, converted, revenuePesewas}]
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
    'revenueTotalPesewas', coalesce((select sum(amount_pesewas) from public.ech_purchases), 0),
    'leadsBySource', coalesce((
      select jsonb_object_agg(source, c)
      from (
        select coalesce(nullif(utm_source, ''), 'direct') source, count(*) c
        from public.ech_leads where not suspected_bot group by 1
      ) src
    ), '{}'::jsonb),
    -- Each purchase is attributed to ONE source (the most recent matching lead
    -- before the purchase), so revenue is never double-counted across leads.
    'sourceFunnel', coalesce((
      with ls as (
        select id, email, created_at, coalesce(nullif(utm_source, ''), 'direct') source
        from public.ech_leads where not suspected_bot
      ),
      agg as (
        select ls.source,
          count(*) leads,
          count(*) filter (where exists (
            select 1 from public.ech_purchases p
            where p.buyer_email = ls.email and p.created_at >= ls.created_at)) converted
        from ls group by ls.source
      ),
      rev as (
        select src, sum(amount_pesewas) revenue
        from (
          select p.amount_pesewas,
            (select l2.source from ls l2
             where l2.email = p.buyer_email and l2.created_at <= p.created_at
             order by l2.created_at desc limit 1) src
          from public.ech_purchases p
        ) t
        where src is not null
        group by src
      )
      select jsonb_agg(jsonb_build_object(
        'source', agg.source, 'leads', agg.leads, 'converted', agg.converted,
        'revenuePesewas', coalesce(rev.revenue, 0)) order by agg.leads desc)
      from agg left join rev on rev.src = agg.source
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.ech_stats_overview() from public, anon, authenticated;
grant execute on function public.ech_stats_overview() to service_role;
