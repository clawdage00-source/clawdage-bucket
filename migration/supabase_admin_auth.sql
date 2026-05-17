-- Admin OTP + email whitelist (run in Supabase SQL Editor after supabase_migration.sql)
-- Bootstrap: insert your first admin email at the bottom.

-- ---------------------------------------------------------------------------
-- allowed_admins — only these emails may use /admin
-- ---------------------------------------------------------------------------
create table if not exists public.allowed_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint allowed_admins_email_unique unique (email),
  constraint allowed_admins_email_lowercase check (email = lower(email))
);

create index if not exists allowed_admins_email_idx on public.allowed_admins (email);

alter table public.allowed_admins enable row level security;

-- No policies: authenticated/anon cannot read or write; use service role from server.

-- ---------------------------------------------------------------------------
-- admin_sessions — tracks OTP-verified admin gate per user
-- ---------------------------------------------------------------------------
create table if not exists public.admin_sessions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  is_verified boolean not null default false,
  verified_at timestamptz,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.admin_sessions enable row level security;

-- Users may read their own row (optional client checks); mutations via service role only.
create policy "admin_sessions_select_own"
  on public.admin_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Bootstrap first admin (replace with your email, lowercase)
-- ---------------------------------------------------------------------------
-- insert into public.allowed_admins (email) values ('alfayadshameer056@gmail.com')
-- on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- Supabase Dashboard (required for OTP / sign-in emails)
-- ---------------------------------------------------------------------------
-- 1. Authentication → Providers → Email → Enable Email provider
-- 2. Authentication → URL Configuration → add Redirect URLs:
--      http://localhost:3000/auth/callback
--      https://YOUR_DOMAIN/auth/callback
-- 3. Authentication → Email Templates → Magic Link — include OTP token, e.g.:
--
--    <h2>Admin sign-in code</h2>
--    <p>Your verification code: <strong>{{ .Token }}</strong></p>
--    <p>Or click: <a href="{{ .ConfirmationURL }}">Sign in</a></p>
--
--    Without {{ .Token }} in the template, only a magic link is sent (no 6-digit code).
-- 4. Project Settings → API → ensure SUPABASE_SERVICE_ROLE_KEY is in app .env.local
-- 5. Optional: configure custom SMTP under Authentication → SMTP for reliable delivery
