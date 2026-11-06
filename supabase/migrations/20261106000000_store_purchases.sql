create table if not exists public.store_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null check (item_id in (
    'syllable-guide',
    'slow-voice',
    'first-sound',
    'double-listen',
    'review-book',
    'focus-compass'
  )),
  amount numeric(10, 2) not null default 2.99 check (amount = 2.99),
  currency text not null default 'BRL' check (currency = 'BRL'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  provider_payment_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.store_purchases enable row level security;
revoke all on public.store_purchases from anon, authenticated;
grant select on public.store_purchases to authenticated;

create policy "Users can read their own store purchases"
  on public.store_purchases for select
  to authenticated
  using ((select auth.uid()) = user_id);
