# PropPilot — Project Reference

## What This Is
A mini real estate inbox app. Agencies receive incoming contacts in real time.
Take-home assignment for PropPilot Junior Full-Stack role.

## Stack
- Vite + React + TypeScript
- Supabase (auth, database, realtime, RLS)
- Tailwind CSS
- Deploy: Vercel or Cloudflare Pages

---

## Database Schema

```sql
create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  agency_id uuid references agencies(id) on delete cascade,
  email text not null
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references agencies(id) on delete cascade,
  name text not null,
  email text not null,
  message text not null,
  status text default 'new',   -- 'new' | 'contacted' | 'discarded'
  created_at timestamptz default now()
);
```

---

## RLS Policies

Run in Supabase SQL Editor:

```sql
alter table agencies enable row level security;
alter table profiles enable row level security;
alter table contacts  enable row level security;

create policy "own profile"
  on profiles for select
  to authenticated
  using (id = auth.uid());

create policy "own agency"
  on agencies for select
  to authenticated
  using (id = (select agency_id from profiles where id = auth.uid()));

create policy "public insert contact"
  on contacts for insert
  with check (status = 'new');

create policy "own agency contacts select"
  on contacts for select
  to authenticated
  using (agency_id = (select agency_id from profiles where id = auth.uid()));

create policy "own agency contacts update"
  on contacts for update
  to authenticated
  using     (agency_id = (select agency_id from profiles where id = auth.uid()))
  with check(agency_id = (select agency_id from profiles where id = auth.uid()));
```

**Why these decisions:**
- `public insert contact` has no `to` clause — covers both anon (form visitor) and authenticated (agent who opens the form while logged in).
- `with check (status = 'new')` on INSERT prevents the form from setting arbitrary status values.
- Agent SELECT/UPDATE use a subquery on `profiles` — multi-tenancy enforced at DB level, not app layer.

---

## Routes

| Path | Component | Auth required |
|------|-----------|---------------|
| `/c/:agencySlug` | `PublicForm` | No |
| `/login` | `Login` | No (redirect to /inbox if already logged in) |
| `/inbox` | `Inbox` | Yes (redirect to /login if not) |

---

## Pages

### PublicForm (`/c/:agencySlug`) ✅ Done
- Fetches agency by slug
- Shows loading → not-found → form states
- Inserts contact into `contacts` table
- No auth required

### Login (`/login`) — TODO
- Email + password via `supabase.auth.signInWithPassword`
- Redirect to `/inbox` on success

### Inbox (`/inbox`) — TODO
- Protected route (needs session)
- Fetch contacts for agent's agency, sorted by `created_at desc`
- Status dropdown: `new` / `contacted` / `discarded`
- Realtime: subscribe to INSERT on contacts, merge without duplicates

---

## Auth Flow (planned)
- `AuthContext` holds session, exposes `session` and `signOut`
- `ProtectedRoute` component wraps `/inbox` — redirects to `/login` if no session
- On login, Supabase sets session in localStorage automatically

---

## Realtime Plan
- After initial fetch, subscribe to `postgres_changes` INSERT on `contacts`
- On new row: check if `id` already in list before prepending (avoids duplicates from race between fetch and subscription)

---

## Seed Data (for demo)

| Agency | Login | Password | Public form | Agency ID |
|--------|-------|----------|-------------|-----------|
| Suncoast Realty | `agent@suncoast.com` | `demo1234` | `/c/suncoast` | `11111111-1111-1111-1111-111111111111` |
| Metro Properties | `agent@metro.com` | `demo1234` | `/c/metro` | `22222222-2222-2222-2222-222222222222` |

**Auth UUIDs (profiles must match these exactly):**
- `agent@suncoast.com` → `c5f77099-49df-4a9e-b78a-964a42b5e455`
- `agent@metro.com` → `fba9aa39-ef8d-45c7-a609-f5559423714c`

**Lessons learned:**
- Do NOT insert into `auth.users` via raw SQL — Supabase's auth system requires internal fields that are hard to replicate. Create users via Authentication → Users dashboard instead.
- After creating users in dashboard, copy their UUIDs and insert profiles manually — UUIDs must match exactly or RLS subquery returns null and inbox appears empty.
- The `agencies` SELECT policy must allow both `anon` AND `authenticated` — when a logged-in agent opens the public form, the request hits as `authenticated`, so an `anon`-only policy won't apply.

---

## Build Progress

- [x] Project scaffolded (Vite + React + TS + Tailwind)
- [x] Supabase client configured
- [x] `PublicForm` page built and working
- [x] Tables created in Supabase
- [x] RLS policies applied
- [x] Login page
- [x] Auth context + protected route
- [x] Inbox page (contacts list + status update)
- [x] Realtime subscription
- [x] Seed data (2 agencies + 2 users)
- [ ] Deploy to Vercel
- [ ] README written
