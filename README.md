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
