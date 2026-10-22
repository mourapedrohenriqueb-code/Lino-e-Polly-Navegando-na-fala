create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create table if not exists public.translation_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, usage_date)
);

alter table public.translation_usage enable row level security;
revoke all on public.translation_usage from anon, authenticated;

create or replace function public.consume_translation_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean := false;
begin
  if auth.uid() is null then
    return false;
  end if;

  insert into public.translation_usage (user_id, usage_date, request_count)
  values (auth.uid(), current_date, 0)
  on conflict (user_id, usage_date) do nothing;

  update public.translation_usage
  set request_count = request_count + 1
  where user_id = auth.uid()
    and usage_date = current_date
    and request_count < 30
  returning true into allowed;

  return coalesce(allowed, false);
end;
$$;

revoke all on function public.consume_translation_quota() from public;
grant execute on function public.consume_translation_quota() to authenticated;
