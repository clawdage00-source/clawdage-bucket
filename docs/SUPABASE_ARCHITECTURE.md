# Clawdage — Supabase usage, scale, and tool architecture

This document explains how **Supabase** is used in the Clawdage (clawdage-all-in-one) application, what capacity you can expect at different scales, and how many tools the current architecture can support.

---

## 1. Executive summary

| Question | Short answer |
|----------|----------------|
| **What does Supabase do here?** | Auth, user profiles, payments metadata, optional tool catalog, usage limits for some Pro tools, analytics events, and admin access — **not** file storage or heavy tool processing. |
| **Where do tools run?** | Almost entirely in the **user’s browser** (Next.js UI on Vercel). Supabase is not in the hot path for PDF/image work. |
| **How many users?** | **Thousands to tens of thousands** of monthly active users are realistic on Supabase **Pro** with tuning; **hundreds of thousands+** need Pro/Team plans, analytics sampling, and DB maintenance. Free tier is fine for development and early launch only. |
| **How many tools?** | **No hard database limit.** You can add dozens to **100+** tools; practical limits are **frontend bundle size**, **build time**, and **maintenance** — not Supabase row count. |

---

## 2. Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  User browser                                                    │
│  • Tool UIs (PDF, images, OCR, etc.) — local processing          │
│  • localStorage (recent tools, anonymous limits)                 │
│  • Optional: client analytics → Supabase insert                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Vercel / Next.js (App Router)                                   │
│  • Server Components, Server Actions                             │
│  • Middleware: session refresh (Supabase Auth cookies)           │
│  • Razorpay checkout + webhook → updates profiles/transactions   │
│  • Admin dashboard (service role reads analytics)                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase (Postgres + Auth)                                      │
│  • auth.users, profiles, transactions, tool_usage                │
│  • analytics_events, tools (catalog), allowed_admins             │
│  • No Supabase Storage for user files in current migrations      │
└─────────────────────────────────────────────────────────────────┘
```

**Design principle:** Clawdage is a **privacy-first utility platform**. Sensitive files stay on the device for supported tools. Supabase holds **accounts, billing state, telemetry, and quotas** — not uploaded PDFs or Aadhaar images.

---

## 3. Supabase tables and purpose

Migrations live in `/migration/`. Run them in order in the Supabase SQL Editor.

| Table | Purpose | Who writes | Who reads |
|-------|---------|------------|-----------|
| `auth.users` | Supabase Auth (email magic link, Google OAuth) | Supabase Auth | App via SSR/client |
| `profiles` | `plan_type`, `access_until`, email; created on signup via trigger | Trigger + payment flow | User (own row), server |
| `transactions` | Razorpay orders/payments (`order_id`, `amount`, `status`, `plan_selected`) | User insert + webhook (service role) | User (own rows), admin |
| `tools` | Catalog: `name`, `slug`, `is_pro` (optional sync with code) | Seed script / manual | Public read (RLS) |
| `tool_usage` | Per-user tool usage timestamps (e.g. daily free limits) | Authenticated user insert | User (own rows), account page |
| `analytics_events` | `page_view`, `tool_use`, `search`, auth events | Browser (anon + authenticated) | Admin only (service role) |
| `allowed_admins` | Email whitelist for `/admin` | Service role (admin settings) | Server only |
| `admin_sessions` | OTP-verified admin gate per user | Service role | Authenticated (own row) |

### 3.1 Row Level Security (RLS)

- **`profiles`**: users can **select/update only their own** row.
- **`transactions`**: users can **select/insert only their own** rows.
- **`tool_usage`**: users can **select/insert only their own** rows.
- **`tools`**: **public read** for everyone.
- **`analytics_events`**: **insert only** for `anon` and `authenticated`; **no public SELECT** (admin uses service role).
- **`allowed_admins`**: no client policies — **service role only**.

### 3.2 What is *not* in Supabase today

- **File storage** (no `storage.buckets` in migrations) — uploads are not stored on Supabase.
- **Tool execution** — merge/compress/OCR run in the browser or call third-party APIs from the client/server without persisting files in Postgres.
- **SEO landing pages / blog content** — static/TS content in the repo, not CMS tables.

---

## 4. How the app uses Supabase (by feature)

### 4.1 Authentication

| Flow | Implementation |
|------|----------------|
| Magic link (email OTP) | `lib/supabase/auth-actions.ts` → `signInWithOtp` |
| Google OAuth | `signInWithOAuth` |
| Session on pages | `@supabase/ssr` — `middleware.ts`, `lib/supabase/server.ts`, `lib/supabase/client.ts` |
| Callback | `app/auth/callback/route.ts` — exchanges code, ensures `profiles` row |
| Sign out | `signOut` server action |

**Protected routes** (middleware redirects if not logged in):

- `/dashboard`, `/account`, `/subscription`, `/profile`

### 4.2 Subscriptions and payments (Razorpay)

| Step | Supabase usage |
|------|----------------|
| User buys pass | `createOrder` requires authenticated user |
| Payment success | `transactions` row + `profiles.plan_type` / `access_until` updated via `lib/payments/apply-pass-purchase.ts` |
| Webhook | `app/api/webhooks/razorpay/route.ts` uses **service role** to apply pass if client verify fails |

Plan gating in the app reads **`profiles`** via `lib/get-profile-plan.ts` (`userHasActivePaidPlan`, `formatPlanBanner`).

### 4.3 Tool usage limits (server-tracked)

Example: **Background remover** (`actions/bg-remover-usage.ts`):

- Signed-in **free** users: max **3 uses per UTC day** in `tool_usage` where `tool_name = 'bg-remover'`.
- **Paid pass**: unlimited (checks `profiles` first).
- **Anonymous**: limit enforced in **localStorage** in the browser, not Supabase.

Other tools can follow the same pattern: insert/count rows in `tool_usage` per `tool_name`.

### 4.4 Analytics

| Client | `lib/analytics.ts` → inserts into `analytics_events` |
| Server | `lib/analytics-server.ts` (optional server-side events) |
| Admin | `actions/get-admin-stats.ts` — service role, last **30 days**, up to **50,000** event rows per query |

Events include: `page_view`, `tool_use`, `search`, `auth_login`, `auth_signup`, etc.

### 4.5 Admin panel

- Whitelist: `allowed_admins`
- OTP + cookie gate: `admin_sessions` + `ADMIN_SESSION_SECRET` (not stored in Postgres alone)
- Stats/revenue: service role queries on `analytics_events`, `transactions`, `profiles`

### 4.6 Optional: `tools` table sync

- Source of truth for the **homepage grid**: `lib/tools-data.ts` (`MVP_TOOLS`).
- Database `tools` table can stay in sync via `npm run db:sync-tools` (`scripts/sync-mvp-tools.ts`) for `is_pro` flags or future dynamic admin.

---

## 5. Environment variables

From `env.local.template`:

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key — respects RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — bypasses RLS (webhooks, admin, payment apply) |
| `SKIP_SUPABASE_MIDDLEWARE=1` | Dev only — skip auth in middleware |
| `FREEMODE=development` | Dev only — unlock Pro features without paid plan |

**Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

---

## 6. How many users can this application support?

Capacity depends on **Supabase plan**, **traffic pattern**, and **how much you write to Postgres** — not on tool count.

### 6.1 What scales easily

- **Anonymous tool users** — processing is local; Supabase only sees optional analytics inserts.
- **Page views** — one small `analytics_events` row per navigation (if tracking enabled).
- **Registered users** — one `profiles` row each; auth MAU limits apply per Supabase pricing.

### 6.2 What becomes heavy first

| Load | Why |
|------|-----|
| **`analytics_events` growth** | Every page view + tool use = insert; admin dashboard reads up to 50k rows/30 days |
| **Middleware `getUser()`** | Runs on most requests when Supabase enabled; slow networks need timeout handling (already capped ~2.8s in middleware) |
| **`tool_usage` inserts** | Grows with active free users on metered tools (3/day × users × tools) |
| **Auth MAU** | Supabase bills by monthly active users on paid auth tiers |

### 6.3 Rough capacity guide (indicative)

These are **order-of-magnitude** estimates for this codebase’s current design — not guarantees.

| Stage | Supabase plan | Typical MAU | Notes |
|-------|---------------|-------------|--------|
| Development | Free | &lt; 50k auth MAU | Pause projects; DB size 500 MB; good for testing |
| Early production | Pro ($25+) | **5k – 50k** MAU | Enable connection pooling; monitor DB size |
| Growth | Pro + compute | **50k – 200k** MAU | Archive/partition `analytics_events`; sample admin stats |
| High scale | Team / Enterprise | **200k+** MAU | Dedicated analytics pipeline (BigQuery, etc.); edge caching; reduce middleware auth calls |

**Vercel** limits are separate (bandwidth, serverless invocations). Heavy tools (large WASM, pdf.js) affect **browser and Vercel** more than Supabase.

### 6.4 Recommendations before large traffic

1. **Partition or trim** `analytics_events` (e.g. keep 90 days, aggregate daily).
2. **Batch or sample** client analytics (e.g. 1 in 10 page views).
3. Use **Supabase connection pooler** (transaction mode) for serverless.
4. **Index review** — migrations already index `analytics_events` and `tool_usage`.
5. Move **admin dashboards** to pre-aggregated tables (nightly job) instead of scanning 50k rows live.
6. Keep **files out of Postgres** — do not store blobs in `jsonb` metadata at scale.

---

## 7. How many tools can you build with this architecture?

### 7.1 Current state

- **13 tools** defined in `lib/tools-data.ts`.
- **12** dedicated routes under `app/tools/<slug>/` plus **`app/tools/[slug]`** for placeholders (e.g. `merge-pdf`, `compress-pdf`).
- Tool UI lives in `components/tools/*-tool.tsx` (often lazy-loaded).

Supabase **`tools` table** can hold **unlimited rows** (practically millions); it only stores metadata (`name`, `slug`, `is_pro`), not tool logic.

### 7.2 What limits tool count (not Supabase)

| Limit | Cause |
|-------|--------|
| **JavaScript bundle size** | Each heavy dependency (pdf.js, handsontable, transformers.js) increases download size |
| **Build time** | More routes = longer `next build` |
| **Maintenance** | SEO content, tests, and UX per tool |
| **Metering complexity** | Only tools that need server quotas need `tool_usage` + server actions |

### 7.3 Practical tool capacity

| Category | Count | Comment |
|----------|-------|---------|
| **Light tools** (QR, simple converters) | **50 – 100+** | Small components, shared patterns |
| **Medium tools** (image resize, PDF client-side) | **30 – 50** | Reuse loaders + `ToolPageSeo` template |
| **Heavy tools** (OCR, bg-removal AI, Excel) | **10 – 20** | Large WASM/models; load via `dynamic()` only on that route |

**Architecture does not cap you at 13 tools** — that number is product choice, not platform limit.

### 7.4 Checklist to add a new tool

1. **Product** — add entry to `lib/tools-data.ts` (`slug`, `name`, `category`, `is_pro`).
2. **UI** — `components/tools/<slug>-tool.tsx` (+ optional `app/tools/<slug>/*-loader.tsx` for code splitting).
3. **Route** — `app/tools/<slug>/page.tsx` with `ToolJsonLd` + tool component.
4. **SEO** — `lib/seo/tool-registry.ts` + `lib/seo/tool-rich-content.ts` overrides.
5. **Database (optional)** — row in `public.tools` + `migration/seed_tools.sql` / `npm run db:sync-tools`.
6. **Metering (optional)** — server actions + `tool_usage` if you need daily limits server-side.
7. **Analytics** — `trackToolUse('<slug>')` in the tool component.

SEO landing pages (`lib/seo/programmatic-pages.ts`) and exam hub entries are **code-only** — no new Supabase tables required.

---

## 8. Client vs server data (privacy model)

| Data | Stored where |
|------|----------------|
| PDFs, images, signatures | User device (during processing); **not** Supabase Storage |
| Login session | HTTP-only cookies (Supabase Auth) |
| Plan / payment history | Supabase `profiles`, `transactions` |
| “3 files today” (some tools) | `tool_usage` or localStorage |
| Recent tools list | `localStorage` (`hooks/use-recent-tools.ts`) |
| Page/tool analytics | Supabase `analytics_events` (path, session id, optional user id) |

---

## 9. Files reference (developers)

| Area | Path |
|------|------|
| Migrations | `migration/supabase_migration.sql`, `supabase_analytics.sql`, `supabase_payment_rls.sql`, `supabase_admin_auth.sql` |
| Types | `types/database.ts` |
| Browser client | `lib/supabase/client.ts` |
| Server client | `lib/supabase/server.ts` |
| Service role | `lib/supabase/admin.ts` |
| Auth actions | `lib/supabase/auth-actions.ts` |
| Middleware | `middleware.ts` |
| Plan / passes | `lib/get-profile-plan.ts`, `lib/payments/apply-pass-purchase.ts` |
| Analytics | `lib/analytics.ts`, `lib/analytics-server.ts` |
| Tool catalog (code) | `lib/tools-data.ts` |
| Sync tools → DB | `scripts/sync-mvp-tools.ts` |

---

## 10. When to upgrade or change architecture

| Signal | Action |
|--------|--------|
| DB &gt; 80% of plan storage | Archive analytics; upgrade plan or external warehouse |
| Auth MAU near plan cap | Upgrade Supabase tier or optimize login prompts |
| Admin stats time out | Pre-aggregate; reduce 50k row scan |
| Many tools, slow first load | More aggressive `dynamic()` imports per route |
| Need cloud processing history | Add Supabase Storage **only** if product requires it — new RLS policies required |
| Need CMS for tools | Optional `tools` + admin UI — still no file blobs in DB |

---

## 11. Summary

- **Supabase** powers **identity, monetization, telemetry, and quotas** — not the core document processing.
- **User scale** is primarily bounded by **Supabase plan + analytics write volume + auth MAU**, not by number of tools.
- **Tool scale** is bounded by **frontend engineering and hosting**, not by Postgres; you can grow from **13 to 50+** tools using the same patterns and optional `tools` / `tool_usage` rows.
- For a growing India-focused utility platform, keep **files local**, **meter only what you must**, and **treat `analytics_events` as the first table to optimize** at scale.

For product roadmap tools, see `NEXT_WANTED_TOOLS.md`. For SEO/growth work, see `docs/GROWTH_IMPLEMENTATION_REPORT.md`.
