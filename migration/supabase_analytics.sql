-- Real-time analytics: visitor, auth, tool, and search events.
-- Run in Supabase SQL Editor after supabase_migration.sql.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  tool_slug text,
  user_id uuid references auth.users (id) on delete set null,
  session_id text not null,
  user_agent text,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_name_idx
  on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_tool_slug_idx
  on public.analytics_events (tool_slug, created_at desc)
  where tool_slug is not null;

create index if not exists analytics_events_session_id_idx
  on public.analytics_events (session_id, created_at desc);

create index if not exists analytics_events_user_id_idx
  on public.analytics_events (user_id, created_at desc)
  where user_id is not null;

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_events_insert_public" on public.analytics_events;

create policy "analytics_events_insert_public"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

-- No public SELECT; admin reads via service role on the server.

comment on table public.analytics_events is
  'Client-tracked page views, tool usage, search, and auth events.';
