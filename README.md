# PropPilot

A real-time real estate inbox app. Agencies receive incoming contact requests through a public form and manage them from a protected inbox.

**Live demo:** https://prop-pilot-xi.vercel.app

---

## Features

- **Public contact form** — visitors submit enquiries via `/c/:agencySlug`, no login required
- **Protected inbox** — agents log in to view and manage contacts for their agency only
- **Status management** — mark contacts as `new`, `contacted`, or `discarded`
- **Real-time updates** — new contacts appear instantly via Supabase Realtime (no refresh needed)
- **Multi-tenancy** — RLS policies ensure each agency only sees its own data

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Backend / DB | Supabase (Postgres + Auth + Realtime) |
| Deploy | Vercel |

---

## Routes

| Path | Description | Auth |
|------|-------------|------|
| `/c/:agencySlug` | Public contact form | No |
| `/login` | Agent login | No |
| `/inbox` | Contact management inbox | Yes |

---

## Demo Accounts

| Agency | Email | Password | Public form |
|--------|-------|----------|-------------|
| Suncoast Realty | `agent@suncoast.com` | `demo1234` | `/c/suncoast` |
| Metro Properties | `agent@metro.com` | `demo1234` | `/c/metro` |

---

## Local Development

Scaffolded with `npm create vite@latest` (React + TypeScript template).

```bash
# Install dependencies
npm install

# Add environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

---

## Database Schema

```sql
agencies  (id, name, slug, created_at)
profiles  (id → auth.users, agency_id, email)
contacts  (id, agency_id, name, email, message, status, created_at)
```

Row Level Security is enabled on all tables — agents can only read and update contacts belonging to their own agency. The public form can insert contacts without authentication.

---

## RLS Design

There are two audiences to secure against:

**Anonymous visitors (public form)** — can INSERT into `contacts` but nothing else. The insert policy has no `to` clause (covers both `anon` and `authenticated` roles) so it still applies when a logged-in agent happens to open the form. A `with check (status = 'new')` guard prevents the form from setting an arbitrary status on insert.

**Authenticated agents (inbox)** — can SELECT and UPDATE only the contacts that belong to their own agency. Both policies use a subquery against `profiles` to resolve the agent's `agency_id` at the DB level, so multi-tenancy is enforced in Postgres rather than in application code.

The `agencies` SELECT policy also covers both `anon` and `authenticated` for the same reason — the public form needs to look up an agency by slug, and if the visitor is already logged in, an anon-only policy would block that fetch.

---

## Realtime Deduplication

On mount, `Inbox` fires an initial fetch (`select * from contacts order by created_at desc`) and simultaneously opens a `postgres_changes` subscription for INSERT events. There is a race window between these two: a contact inserted after the fetch query starts but before the subscription ACKs could arrive in both the query result and the realtime payload.

The handler guards against this with an `id` check before prepending:

```ts
setContacts((prev) => {
  if (prev.some((c) => c.id === incoming.id)) return prev;
  return [incoming, ...prev];
});
```

Because `setContacts` receives the functional updater form, the check always runs against the latest state, not a stale closure.

---

## What Was Left Out

- **Search / filter** — no filtering by status or name. The inbox lists all contacts in reverse-chronological order. Adding filter state would be straightforward but wasn't in scope.
- **Pagination** — all contacts are fetched in one query. Fine for a demo; a production inbox would need cursor-based pagination.
- **Email notifications** — no server-side trigger to email the agent when a new contact arrives. Would require a Supabase Edge Function or a third-party webhook.
- **Profile / agency management UI** — agencies and user accounts are seeded manually via SQL. There's no UI to create or edit them.

---

## AI Assistance

**Where it helped:** Generating the RLS SQL policies and explaining why the `to` clause matters for the anon/authenticated edge case. Spotting that the `agencies` SELECT policy needed to cover both roles, which I'd missed initially.
