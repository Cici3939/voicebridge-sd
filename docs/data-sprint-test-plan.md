# Data Sprint Test Plan — 1:30-2:45 PM Sat

Goal: Bright Data → Neon works end-to-end, with a fallback so demo never shows empty.

## Step 1 — Neon is live (5 min)
- [ ] `neon init` done, `.env.local` has `DATABASE_URL`
- [ ] Ran `db/schema.sql` in Neon SQL Editor — `resources` table exists
- [ ] Ran `npm run seed` — check Neon: `SELECT count(*) FROM resources;` should be 12

## Step 2 — Scraper, one source first (30 min)
- [ ] Pick ONE source first: https://211sandiego.org/ (easiest to parse)
- [ ] Run `npm run scrape` — does it return HTML without a 403/block?
- [ ] If blocked: use Bright Data Web Unlocker / SERP API with your zone, retry once
- [ ] If still blocked after 15 min: STOP, use seeded Neon data + show scraper logs in video. Don't burn the sprint.

## Step 3 — Parse + upsert (30 min)
- [ ] Extract name / address / hours / phone from HTML — even 3 fields is enough
- [ ] Upsert into Neon with `last_scraped = NOW()` — use `ON CONFLICT (name) DO UPDATE`
- [ ] Verify: `SELECT name, last_scraped FROM resources ORDER BY last_scraped DESC LIMIT 3;`

## Step 4 — API check (15 min)
- [ ] `GET /api/resources?type=food` returns JSON from Neon, not from seed file
- [ ] `GET /api/resources?type=food&area=La%20Jolla` filters correctly
- [ ] If API fails, check `DATABASE_URL` has `?sslmode=require`

## Done when
- `/api/resources?type=food` returns 3+ live rows with today's `last_scraped`
- Fallback seed data is still there if scraping fails live

## If you're behind at 2:45
- Cut to 1 source only, keep seed data as your demo data, move on to Gemini. Do NOT miss the 2:45 SpaceXSI workshop.
