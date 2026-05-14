-- Razorpay client path: authenticated users may insert their own transaction rows after verify.
-- Webhooks use the service role and bypass RLS.

alter table public.transactions
  add column if not exists created_at timestamptz not null default now();

drop policy if exists "transactions_insert_own" on public.transactions;

create policy "transactions_insert_own"
  on public.transactions
  for insert
  with check (auth.uid() = user_id);

create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc);
