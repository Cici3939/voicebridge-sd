# VoiceBridge SD — SanD Hacks 2026

Voice-first finder for free food, shelter, and clinics in San Diego.
Built solo by Cici + Muse for UCSD SanD Hacks, Nov 14-15, 2026.

**One sentence:** You speak — "I need free food near La Jolla today" — and it answers out loud, in plain language, with name, address, and hours.

> STATUS Sat ~2:55pm: demo works end to end — ask takes ~11 sec and speaks out loud (ElevenLabs TTS), 🎤 Speak mic button added (Chrome/Edge), pre-recorded fallback audio wired in if live TTS flakes, 12 real listings seeded in Neon. Latest commit: aeffa94. Still pending: Bright Data zone `voicebridge_sd` (live scrape 400s without it) and SpaceXSI Cursor Pro + Grok Bot (workshop 2:45-3:15pm).

## Stack — how each sponsor is used (for Devpost)

- **Bright Data — Data for Good (Impact / Tech for Good, biggest prize pool):** Scrapes live listings from 211 San Diego, Feeding San Diego, and San Diego Food Bank. Every listing in Neon has a `last_scraped` timestamp so judges can see it's live, not mocked. Prizes per Slack: $1,000 1st / $750 2nd / $500 3rd paid in Bright Data API credits. Every team also gets $100 in Bright Data credits to build with. (Note: live scrape currently 400s — the Web Unlocker zone `voicebridge_sd` still needs creating in the Bright Data dashboard; seeded data is the fallback until then.)
- **Neon — Best Database-Driven / Agent Backend:** All resources live in Neon Postgres. See `db/schema.sql`. The API queries Neon, it doesn't just read a JSON file.
- **Gemini — Best Use of Gemini API:** Parses the user's intent ("food", "shelter", "clinic", location, language), filters Neon results, and writes a simple 6th-grade summary. Model: gemini-3.8-flash via Google AI Studio. (Gemini calls sometimes hang, so parse/summarize have 5s timeouts with keyword/template fallbacks — the demo still works.)
- **ElevenLabs — Best Project Built with ElevenLabs:** Speaks the Gemini answer out loud. Voice is core — this is for people who can't easily read/search in English, are elderly, or are visually impaired. Not a bolt-on TTS button at the end.
- **SpaceXSI — Build Your Hackathon A-Team:** Built in Cursor as the core coding agent + Grok Bot automation. Describe both in Devpost and opt in to the raffle.
- **Best Overall + UCSD Basement Most Innovative:** Same project, same demo.

## Quick start — 9-minute setup

1. Create a Neon project at neon.tech → copy `DATABASE_URL`
2. Run `db/schema.sql` in the Neon SQL editor
3. Get keys:
   - Bright Data: dashboard → API key + zone
   - Gemini: https://aistudio.google.com/api-keys → Create API key
   - ElevenLabs: dashboard → API key, pick a Voice ID
4. Copy `.env.example` to `.env.local` and paste keys
5. `npm install`
6. Seed fallback data: `npm run seed` (uses `data/seed.json` — real orgs, verify hours before demo)
7. `npm run dev` → open http://localhost:3000 (or :3001 if 3000 is already in use)

## Flow

```
User speaks/types
  → /api/ask
  → Gemini parses intent
  → Neon query (type + area)
  → Gemini summarizes to plain language
  → ElevenLabs TTS speaks it
  → UI shows cards + plays audio
```

Bright Data scraper (`scripts/scrape.ts` + `scrapeWithBrightData` / `extractListingsFromHtml` / `upsertResources` in `lib/voicebridge.ts`) runs separately:
`npm run scrape` → Bright Data fetches sources → Gemini extracts listings → upserts into Neon with `last_scraped = now()`. If a source fails, seeded data stays as fallback.

## Files

- `db/schema.sql` — Neon tables
- `data/seed.json` — 12 fallback listings (verify before judging)
- `lib/voicebridge.ts` — Bright Data + Neon + Gemini + ElevenLabs helpers in one place
- `app/api/ask/route.ts` — POST { query } → { answer, resources, audioBase64, parsed }; if ElevenLabs fails it still returns the text answer and the page plays a pre-recorded fallback from `public/fallback-audio/`
- `app/api/resources/route.ts` — GET ?type=food → Neon rows
- `app/page.tsx` — big-button UI with mic (Web Speech API) + text input, plays live or fallback audio

## Demo script (3 min video)

0:00-0:30 Problem: finding free help in San Diego means digging through 5 websites in English.
0:30-1:30 Live demo: speak "I need free food near La Jolla today" → hear answer, show cards + hours.
1:30-2:30 Tech: Bright Data live scrape timestamp → Neon → Gemini summary → ElevenLabs voice.
2:30-3:00 Impact: who it helps, what you'd add next.

## Cut list (if behind)

- Speech-to-text is DONE (🎤 Speak button, Chrome/Edge) — no cut needed.
- Behind at 10pm Sat: drop Spanish, keep simple English.
- Scraping blocked: use seeded Neon data + show scraper logs in video.

## Deadlines — do not miss

- Sun 11:00 AM: Initial Devpost (placeholder fine)
- Sun 12:00 PM: Final Devpost, NO commits after 12pm
- Sun 12:30-2:30 PM: Judging, Qualcomm Room, 3 min + 2 min Q&A per judge
- No commits before Sat 10:30 AM or after Sun 12:00 PM
