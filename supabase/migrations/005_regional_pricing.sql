-- Regional pricing: record what the buyer was SHOWN alongside what was billed.
--
-- amount_pesewas / currency stay exactly as they were, always GHS, because
-- Paystack (Ghana account) can only ever collect cedis. Revenue reporting in
-- api/admin-stats.php therefore keeps summing one currency and needs no change.
--
-- The three new columns capture the regional face of the sale: which price
-- region the buyer was quoted at, and the converted figure they actually saw
-- ("$50"). Defaults describe the pre-regional world, so existing rows read
-- back as plain Ghana purchases rather than nulls.

alter table public.ech_purchases
  add column if not exists region text not null default 'GH',
  add column if not exists display_currency text not null default 'GHS',
  add column if not exists display_minor integer not null default 0;

-- Backfill: before this feature every sale was quoted in cedis at the GH
-- price, so the displayed amount was the billed amount.
update public.ech_purchases
   set display_minor = amount_pesewas
 where display_minor = 0;

-- Revenue-by-region is the reason this feature exists, so make that read cheap.
create index if not exists ix_ech_purch_region on public.ech_purchases (region);
