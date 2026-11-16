-- Puke Town Gaming: initial foundation schema.
-- Apply only to a NEW, dedicated Supabase project.
-- This migration creates structure only; it does not enable provider integrations or rewards.

create extension if not exists pgcrypto;

create table if not exists public.gaming_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gamertag text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('xbox','playstation','discord')),
  consent_scope text[] not null default '{}',
  policy_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.linked_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('xbox','playstation','discord')),
  provider_account_id text not null,
  display_name text,
  connection_status text not null default 'pending'
    check (connection_status in ('pending','active','revoked','error')),
  consent_id uuid references public.account_consents(id),
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_account_id)
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_game_id text not null,
  title text not null,
  image_url text,
  created_at timestamptz not null default now(),
  unique(provider, provider_game_id)
);

create table if not exists public.gaming_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  linked_account_id uuid references public.linked_accounts(id),
  game_id uuid references public.games(id),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','verified','rejected')),
  source_event_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  provider_achievement_id text not null,
  title text not null,
  description text,
  points integer check (points is null or points >= 0),
  created_at timestamptz not null default now(),
  unique(game_id, provider_achievement_id)
);

create table if not exists public.member_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','verified','rejected')),
  source_event_id text,
  created_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

create table if not exists public.xp_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null check (amount <> 0),
  reason text not null,
  source_type text not null,
  source_id text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

-- Reward balances and ledger are deliberately separate from XP.
-- No browser-facing insert/update policies are created for financial records.
create table if not exists public.reward_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(18,2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete restrict,
  entry_type text not null check (entry_type in ('revenue_cleared','reserve_allocation','credit_issuance','redemption','refund','adjustment')),
  amount numeric(18,2) not null check (amount <> 0),
  currency char(3) not null,
  source_reference text not null,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.reward_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft' check (status in ('draft','approved','paused','closed')),
  provider_approval_reference text,
  funded_amount numeric(18,2) not null default 0 check (funded_amount >= 0),
  reserved_amount numeric(18,2) not null default 0 check (reserved_amount >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check (reserved_amount <= funded_amount)
);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  campaign_id uuid references public.reward_campaigns(id),
  reward_name text not null,
  credits numeric(18,2) not null check (credits > 0),
  status text not null default 'requested' check (status in ('requested','approved','fulfilled','rejected','cancelled')),
  fulfilment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  event_type text not null,
  external_event_id text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected','error')),
  payload_hash text,
  received_at timestamptz not null default now(),
  verified_at timestamptz,
  unique(provider, external_event_id)
);

create table if not exists public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  severity text not null default 'review' check (severity in ('low','review','high','critical')),
  status text not null default 'open' check (status in ('open','investigating','cleared','actioned')),
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_started on public.gaming_sessions(user_id, started_at desc);
create index if not exists idx_member_achievements_user on public.member_achievements(user_id, unlocked_at desc);
create index if not exists idx_xp_transactions_user on public.xp_transactions(user_id, created_at desc);
create index if not exists idx_verification_events_status on public.verification_events(verification_status, received_at);
create index if not exists idx_fraud_flags_user_status on public.fraud_flags(user_id, status);

-- Enable RLS on all user or financial data tables.
alter table public.gaming_profiles enable row level security;
alter table public.account_consents enable row level security;
alter table public.linked_accounts enable row level security;
alter table public.gaming_sessions enable row level security;
alter table public.member_achievements enable row level security;
alter table public.xp_wallets enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.reward_wallets enable row level security;
alter table public.financial_ledger enable row level security;
alter table public.redemptions enable row level security;
alter table public.verification_events enable row level security;
alter table public.fraud_flags enable row level security;
alter table public.audit_events enable row level security;

create policy "Members can read own gaming profile" on public.gaming_profiles
  for select to authenticated using (auth.uid() = user_id);
create policy "Members can create own gaming profile" on public.gaming_profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Members can update own gaming profile" on public.gaming_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Members can read own consents" on public.account_consents
  for select to authenticated using (auth.uid() = user_id);
create policy "Members can read own linked accounts" on public.linked_accounts
  for select to authenticated using (auth.uid() = user_id);
create policy "Members can read own sessions" on public.gaming_sessions
  for select to authenticated using (auth.uid() = user_id);
create policy "Members can read own achievements" on public.member_achievements
  for select to authenticated using (auth.uid() = user_id);
create policy "Members can read own XP wallet" on public.xp_wallets
  for select to authenticated using (auth.uid() = user_id);
create policy "Members can read own XP transactions" on public.xp_transactions
  for select to authenticated using (auth.uid() = user_id);
create policy "Members can read own reward wallet" on public.reward_wallets
  for select to authenticated using (auth.uid() = user_id);
create policy "Members can read own redemptions" on public.redemptions
  for select to authenticated using (auth.uid() = user_id);
create policy "Members can read own verification events" on public.verification_events
  for select to authenticated using (auth.uid() = user_id);
create policy "Members can read own fraud flags" on public.fraud_flags
  for select to authenticated using (auth.uid() = user_id);

-- No client write policies for XP, Reward Credits, financial ledger, fraud or audit data.
-- Trusted server-side functions must validate and write these records.
