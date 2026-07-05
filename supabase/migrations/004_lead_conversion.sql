-- Lead Conversion CRM support:
--  1. surface each lead's most recent note (call comment) in the admin list, so
--     the conversion board cards can show the latest contact outcome at a glance.
--  2. ech_reconcile_conversions(): flip any lead with a matching purchase to
--     'converted' (belt-and-suspenders alongside the immediate auto-convert in
--     verify-payment.php; also catches purchases recorded out-of-band).

-- ── ech_leads_with_meta: add last_note ───────────────────────────────────
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
          'last_note', (
            select n.body from public.ech_lead_notes n
            where n.lead_id = f.id order by n.created_at desc limit 1
          ),
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

-- ── ech_reconcile_conversions: mark buyers as converted ──────────────────
create or replace function public.ech_reconcile_conversions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.ech_leads l
  set status = 'converted', status_updated_at = now()
  where l.status <> 'converted'
    and l.email <> ''
    and exists (
      select 1 from public.ech_purchases p where p.buyer_email = l.email
    );
  get diagnostics n = row_count;
  return n;
end
$$;

revoke all on function public.ech_leads_with_meta(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.ech_reconcile_conversions() from public, anon, authenticated;
grant execute on function public.ech_leads_with_meta(text, text, integer, integer) to service_role;
grant execute on function public.ech_reconcile_conversions() to service_role;
