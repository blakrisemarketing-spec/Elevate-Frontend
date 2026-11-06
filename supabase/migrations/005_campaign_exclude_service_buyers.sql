-- The Grad School Match nurture campaign used to sell the Get Into Grad School
-- Bootcamp, so ech_campaign_due_leads() only excluded bootcamp buyers. That
-- cohort has ended and the sequence now sells the 1-on-1 grad school services,
-- which means the old exclusion no longer covers the thing we are selling: a
-- lead who buys a GHS 850 personal statement today would keep receiving emails
-- asking them to book a session.
--
-- Widen the exclusion to anyone who has bought grad school help of any kind.
-- The bootcamp clause stays for the leads who bought into the 2026 cohort.

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
        and (
          p.service_id ilike 'edu-%'
          or p.service_id ilike 'bootcamp-grad%'
          or p.item_name ilike '%grad school bootcamp%'
        )
    )
  order by l.created_at asc
$$;
