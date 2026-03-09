create extension if not exists "pgcrypto";

create type public.plan_code as enum ('free', 'cheap', 'unlimited');
create type public.plan_status as enum ('trialing', 'active', 'past_due', 'canceled', 'paused');
create type public.block_item_type as enum ('artist', 'song');
create type public.block_item_source as enum ('manual', 'current_track', 'history_suggestion');
create type public.playback_action as enum ('played', 'skipped', 'prompted');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.subscription_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan public.plan_code not null default 'free',
  status public.plan_status not null default 'active',
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  blocklist_limit integer not null default 3,
  items_per_blocklist_limit integer,
  analytics_level integer not null default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  period_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create table public.blocklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.blocklist_items (
  id uuid primary key default gen_random_uuid(),
  blocklist_id uuid not null references public.blocklists(id) on delete cascade,
  type public.block_item_type not null,
  display_value text not null,
  normalized_value text not null,
  source public.block_item_source not null default 'manual',
  external_reference text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (blocklist_id, type, normalized_value)
);

create table public.playback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  artist text not null,
  normalized_title text not null,
  normalized_artist text not null,
  seen_at timestamptz not null default timezone('utc', now()),
  action public.playback_action not null default 'played',
  matched_item_id uuid references public.blocklist_items(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

create index blocklists_user_idx on public.blocklists(user_id, sort_order);
create index blocklist_items_blocklist_idx on public.blocklist_items(blocklist_id);
create index playback_events_user_seen_idx on public.playback_events(user_id, seen_at desc);
create index playback_events_user_action_idx on public.playback_events(user_id, action);

create or replace function public.set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_timestamp();

create trigger entitlements_updated_at
before update on public.subscription_entitlements
for each row execute procedure public.set_timestamp();

create trigger blocklists_updated_at
before update on public.blocklists
for each row execute procedure public.set_timestamp();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.subscription_entitlements (
    user_id,
    plan,
    status,
    billing_cycle,
    blocklist_limit,
    items_per_blocklist_limit,
    analytics_level
  )
  values (new.id, 'free', 'active', 'monthly', 3, 3, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace view public.analytics_summary_90d as
select
  user_id,
  count(*) filter (where action = 'played') as tracks_seen,
  count(*) filter (where action = 'skipped') as skips_triggered,
  count(*) filter (where action = 'prompted') as prompts_triggered,
  count(*) filter (where matched_item_id is not null) as matched_tracks
from public.playback_events
where seen_at >= timezone('utc', now()) - interval '90 days'
group by user_id;

alter table public.profiles enable row level security;
alter table public.subscription_entitlements enable row level security;
alter table public.blocklists enable row level security;
alter table public.blocklist_items enable row level security;
alter table public.playback_events enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id);

create policy "entitlements_select_own"
on public.subscription_entitlements
for select
to authenticated
using (auth.uid() = user_id);

create policy "blocklists_manage_own"
on public.blocklists
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "blocklist_items_manage_own"
on public.blocklist_items
for all
to authenticated
using (
  exists (
    select 1
    from public.blocklists
    where public.blocklists.id = blocklist_items.blocklist_id
      and public.blocklists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.blocklists
    where public.blocklists.id = blocklist_items.blocklist_id
      and public.blocklists.user_id = auth.uid()
  )
);

create policy "playback_events_manage_own"
on public.playback_events
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
