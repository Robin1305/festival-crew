# Festival Crew — Setup Guide

## 1. Supabase (free, ~5 min)

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon public key** (Settings → API)
3. Open the **SQL Editor** and paste + run the contents of `supabase/migrations/001_initial.sql`
4. Enable Realtime on 3 tables (Table Editor → each table → Realtime toggle):
   - `members`
   - `bulletin_posts`
   - `meet_pins`

## 2. Local setup

```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

pnpm dev
```

## 3. Seed Southside POIs (optional but nice)

In the Supabase SQL Editor, run this after creating a group:

```sql
-- Replace 'abc123' with your actual group code
insert into pois (group_code, label, icon, lat, lng) values
  ('abc123', 'Green Stage',      'stage',    47.9062, 8.8330),
  ('abc123', 'Blue Stage',       'stage',    47.9055, 8.8360),
  ('abc123', 'Red Stage',        'stage',    47.9040, 8.8310),
  ('abc123', 'White Stage',      'stage',    47.9048, 8.8380),
  ('abc123', 'Electric Wave X',  'stage',    47.9035, 8.8340),
  ('abc123', 'West Entrance',    'entrance', 47.9068, 8.8280),
  ('abc123', 'East Entrance',    'entrance', 47.9068, 8.8420),
  ('abc123', 'Medical / First Aid', 'medical', 47.9050, 8.8340),
  ('abc123', 'Info Point',       'info',     47.9065, 8.8320),
  ('abc123', 'Camping (Outfield)','camping', 47.9025, 8.8300);
```

> **Note:** The Southside 2026 map PDF isn't out yet. Check
> `southside.de/en/info/site-maps/` before the festival and update the
> coordinates if needed — the airfield layout typically stays the same.

## 4. Deploy to Vercel (free, ~2 min)

```bash
# Push to GitHub first
git init && git add . && git commit -m "feat: festival crew app"
gh repo create festival-crew --public --push
```

Then at [vercel.com](https://vercel.com):
1. Import the GitHub repo
2. Framework preset: **Vite** (auto-detected)
3. Add env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy → live in ~60 seconds

## 5. Share with the group

1. Open your live URL → **Create a group**
2. The QR code pops up automatically — screenshot it and share in your WhatsApp group
3. Or share the `/join/abc123` link directly

## How it works

- **Map**: everyone's location shown in real-time, color-coded by name
- **📡 in topbar**: toggles location sharing on/off (battery saver)
- **📍 in topbar**: tap to enter drop-pin mode, then tap anywhere on the map
- **🔗 in topbar**: shows the QR code / join link
- **Board tab**: bulletin board — post messages, see SOS alerts
- **Friends tab**: who's online, change your name
- **SOS tab**: 2-tap confirmation → flashes your marker red, posts to board
