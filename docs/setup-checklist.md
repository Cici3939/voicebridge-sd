# Setup Checklist — Updated 12:33 PM Sat Nov 14 (lunch)

Status now: GitHub repo created — https://github.com/Cici3939/voicebridge-sd — Bright Data redeemed, Gemini key done. Neon account created, project `dawn-paper-01055964` (org `org-sweet-cloud-51381943`). Still open: Neon promo-credits redeem flow (couldn't find it — see below, it does NOT block building), ElevenLabs Creator tier, SpaceXSI at the 2:45 workshop.

## 1. Copy the scaffold into your repo
- Copy everything from `voicebridge-sd/` in Muse's workspace into https://github.com/Cici3939/voicebridge-sd
- DO NOT copy `node_modules/` (363 MB) or `.next/` — they're already in `.gitignore`
- `git add . && git commit -m "init: VoiceBridge SD scaffold" && git push`
- Fixes made at 12:33 while you were at lunch: added missing `app/layout.tsx` (Next won't run without it), `tsconfig.json`, `.gitignore`; fixed `npm install` (Next 15.0.0 rejected React 19 — bumped to 15.1.0, install + `tsc --noEmit` + `npm run build` all verified passing); fixed the flagship "food near La Jolla" query returning zero rows (area fallback to type-only results); the scraper now actually extracts listings with Gemini and upserts them into Neon instead of just returning HTML.

## 2. Neon (5 min — blocks the 1:30 data sprint, do first)
- Open project `dawn-paper-01055964` in the Neon console → copy the connection string → that's your `DATABASE_URL` (should end `?sslmode=require`)
- Neon SQL Editor → paste `db/schema.sql` → Run (includes the unique index seed/scrape upserts need)
- `npm install` (works now — see above), then `npm run seed` to load the 12 fallback listings
- Promo credits: no verified redeem flow found for this event — the Neon table / MLH Coach / Slack is the place to ask. Don't let it block you: the Neon free tier needs no credit card and is plenty for a weekend demo (100 CU-hours/month, 1 GB storage).

## 3. ElevenLabs (3 min)
- Create a free account → API key + pick a Voice ID → paste into `.env.local`
- Creator tier: no verified hackathon redeem link found — ask at the ElevenLabs table / in Slack. Free plan gives 10,000 credits/month with no card, and one of our <80-word answers costs ~500 credits, so the free plan covers the whole demo.

## 4. Keys — paste into `.env.local` (copy from `.env.example`)
- Bright Data: done — API key + zone `voicebridge_sd` ($100 credits)
- Gemini: done — key from https://aistudio.google.com/api-keys
- ElevenLabs: API key + Voice ID (see step 3)
- Neon: `DATABASE_URL` (see step 2)

## 5. Run (2 min)
- `npm install`
- `npm run dev` → http://localhost:3000
- Test: type "I need free food near La Jolla today" → should return 3 cards (fallback now returns San Diego food banks instead of empty)

## If something fails
- Neon won't connect? Check DATABASE_URL has `?sslmode=require`
- Gemini 400? Check API key is from AI Studio, not Cloud Console
- ElevenLabs fails? App still returns text answer — demo continues, audio is optional
- Bright Data blocked? Use seeded Neon data, show scraper logs in video. Or run `npm run scrape` — it now extracts + upserts for real.

## What to tell Muse when you're back
- Repo URL (already have it: https://github.com/Cici3939/voicebridge-sd) — just confirm the scaffold is pushed
- "Neon done / ElevenLabs done" — or the error message if one fails
- "Ready for data sprint" — then we start the 1:30 sprint. Leave ~2:35 to walk to WLH 2207 for the 2:45 SpaceXSI workshop.
