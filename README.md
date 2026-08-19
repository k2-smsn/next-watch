# Work Timer

A daily work-session stopwatch with streak tracking, rebuilt from a vanilla JS/localStorage app into Next.js (App Router, plain JS) with Supabase as the backend and Supabase Auth for per-user accounts.

## Features

- Start/stop stopwatch with a live-ticking display
- Daily goal progress bar
- Current streak + longest streak tracking
- Recent 7 days view on the home page
- Full log history on `/logs`, filterable by All / This Month / This Week
- Email/password authentication, with per-user data isolation via Postgres Row Level Security
- Timer state persists across route navigation (lives in a React Context above the router)

## Tech stack

- **Next.js 16** (App Router, plain JavaScript — no TypeScript, no Tailwind)
- **Supabase** — Postgres database + Auth
- `@supabase/ssr` for cookie-aware auth across Client Components, Server Components, and the proxy
- Plain CSS (`app/globals.css`)

## Project structure

```
app/
  layout.js              # Root layout, wraps app in TimerProvider
  page.js                # Home page — timer, progress, streaks, recent days
  globals.css             # All styling
  context/
    TimerContext.js       # Timer state, Supabase reads/writes, auth-aware
  logs/
    page.js               # Full log history with filters
  login/
    page.js               # Email/password sign-in
  signup/
    page.js               # Email/password sign-up
  components/
    SignOutButton.js      # Sign-out action used on home + logs pages
lib/
  supabaseClient.js        # Browser Supabase client (createClient factory)
  supabaseServerClient.js  # Server Supabase client (Server Components)
  timer.js                 # Pure helpers: formatting, fetch/save day seconds
  streak.js                 # Pure helpers: streak math, day filtering
  constants.js               # GOAL_SECONDS (daily goal, in seconds)
proxy.js                     # Session refresh + route protection (Next.js 16)
```

## Database

Single table, `day_logs`, in Supabase:

```sql
create table day_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  log_date date not null,
  seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);
```

Row Level Security is enabled, with policies restricting all select/insert/update/delete operations to rows where `auth.uid() = user_id`. This is the real enforcement layer — `proxy.js` only handles redirects and session refresh, it does not gate data access on its own.

## How the timer persists data

To avoid excessive writes, the app does **not** save on every tick. Supabase writes happen only:

- **On Start** — saves the current accumulated total (baseline for the session)
- **On Stop** — saves the final total for the day
- **On Reset** — saves `0`
- **On tab close / tab hide** (`beforeunload` / `visibilitychange`) — best-effort save of the in-progress total, as a safety net against losing time from an orderly tab close

The live-ticking display itself updates every second from local React state only — no network call per tick.

## Auth flow

- Email/password via Supabase Auth (email confirmation configurable in Supabase project settings — off during local development, intended to be turned on before deploying)
- `proxy.js` (Next.js 16's replacement for `middleware.js`) runs on every non-static request:
  - Refreshes the Supabase session cookie if the access token has expired
  - Redirects unauthenticated visitors away from `/` and `/logs` to `/login`
  - Redirects authenticated visitors away from `/login`/`/signup` back to `/`
- `TimerContext` tracks the current user via `supabase.auth.getSession()` + an `onAuthStateChange` listener, and scopes every Supabase query to that user's id

## Environment variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Setup

1. Create the `day_logs` table and RLS policies in Supabase (see above)
2. Add `.env.local` with your project credentials
3. `npm install`
4. `npm run dev`

## Before deploying

- Turn on email confirmation in Supabase Auth settings (already scaffolded to handle the "check your email" / unverified login state)
- Update Supabase Auth's allowed redirect URLs to include your production domain
- Double check `proxy.js`'s `PROTECTED_PATHS` if you add new routes that need auth
