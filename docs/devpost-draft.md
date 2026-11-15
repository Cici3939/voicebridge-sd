# Devpost Draft — VoiceBridge SD

> STATUS Sat 7:59pm: demo works end to end (ask -> Neon -> spoken answer in ~11 sec). Spanish answers built in. 🎤 Speak mic fixed + VoiceTide interactive art merged (build verified clean). Seeded 12 real listings in Neon. SpaceXSI CONFIRMED: promo redeemed, Cursor Pro running (ran the Gemini test, did the UI polish + mic fix + VoiceTide), Grok Bot triaged issue #1 and posted the fix plan. Bright Data zone `voicebridge_sd` CREATED — the 400 is fixed and the scrape runs, but it extracts 0 listings because Gemini's free-tier quota (20/day) is exhausted (429) — extraction uses Gemini too. Second Gemini key in a new project is being made tonight for a fresh 20; otherwise the quota resets ~midnight. Paste video link at the bottom before submitting.

## Tagline
Voice-first help finder for San Diego — speak what you need, hear where to go.

## Problem
Finding free food, shelter, or a clinic in San Diego means digging through 5 different websites, in English, on a small phone. For people who can't easily read English, are elderly, or are visually impaired, that search itself is the barrier.

## Solution
VoiceBridge SD lets you speak — "I need free food near La Jolla today" — and answers out loud in plain language with name, address, and hours.

Flow: Bright Data scrapes live listings → Neon stores them → Gemini understands + summarizes → ElevenLabs speaks it.

## How each sponsor is used — READ THIS FOR JUDGES

- **Bright Data — Data for Good:** We use Bright Data to scrape live listings from 211 San Diego, Feeding San Diego, and San Diego Food Bank. Every resource in Neon has a `last_scraped` timestamp. *(Status: zone `voicebridge_sd` created ~7:55 PM and the 400 is fixed — the scrape now runs cleanly, but it extracts 0 listings because extraction uses Gemini, whose free-tier quota (20/day) is exhausted. A second Gemini key is being made tonight; otherwise the quota resets ~midnight. Until a scrape actually upserts listings, the demo runs on 12 real seeded listings. Do NOT submit claiming live scraped data before a scrape actually succeeds.)* We received $100 in Bright Data credits per team.
- **Neon — Best Database-Driven / Agent Backend:** All resources live in Neon Postgres (`resources` table). The API queries Neon by type + area. No JSON file fallback in production — seed data is only a fallback if scraping fails.
- **ElevenLabs — Best Project Built with ElevenLabs:** Voice is core, not a bolt-on. The Gemini answer is spoken with ElevenLabs TTS (eleven_multilingual_v2). This is designed for low-literacy, elderly, and visually-impaired users. Everyone gets Creator tier credits.
- **Gemini — Best Use of Gemini API:** Gemini parses intent (food/shelter/clinic, area, language) and summarizes Neon results into simple 6th-grade spoken language under 80 words. Model: gemini-3.8-flash via Google AI Studio. *(Honest note: live Gemini calls currently fail — the Nov 14 ~7:57pm test got a 429 "quota exceeded" (free tier is 20 requests/day, used up by testing + scrapes; resets ~midnight). A second key in a new project was made tonight — the 429 is gone, but the ~8:02pm test got a 503 "high demand" instead, and the test failed twice more after that (timeout, then 503 again). Switched the model to gemini-2.5-flash ~10pm, but the ~10:30pm test got a 404 — 2.5-flash is "no longer available to new users" on the new project, and Google's own error message says to use gemini-3.8-flash. Switched back to gemini-3.8-flash ~10:30pm — test it Sunday morning at the venue with the new key before claiming a live answer. Until a live call is observed returning OK, the demo falls back to keyword parsing + a template summary. The demo works, but don't claim Gemini produced a specific live answer until a live call is observed returning successfully.)*
- **SpaceXSI — Build Your Hackathon A-Team:** Built in Cursor Pro as our core AI coding agent (via a free month of X Premium) — Cursor ran our Gemini test script and does tonight's coding. Grok Bot automation watches our repo: it triaged our first real issue (Bright Data scrape 400 — labeled it `data`, posted a fix plan as a comment) and summarizes new scrape commits as they land, so our tiny solo team stays in sync. One X Premium subscription gave access to Cursor, Grok Bot, and Grok API. We opted in to the raffle.
- **Best Overall / Most Innovative:** Same project — most outstanding + most unique real-world solution.

## Challenges
- Scraping real sites without breaking: sites change layout, so we built a seed fallback in Neon so the demo never shows empty.
- Making voice actually useful, not just TTS: Gemini summary had to be short, plain, and spoken — not a wall of text read aloud.
- Solo + time: 26 hours, one person, 5 tracks. We cut speech-to-text if needed and kept TTS only.

## What we learned
Live data + a real database + a voice interface beats a pretty frontend. Judges score idea + demo, not code quality — so we spent time on the 30-second voice demo.

## Built With
Next.js, TypeScript, Neon Postgres, Bright Data, Gemini API (Google AI Studio), ElevenLabs, Cursor, Grok Bot

## Links to include on Devpost
- GitHub repo link: https://github.com/Cici3939/voicebridge-sd
- Video: [PASTE PUBLIC YOUTUBE / DRIVE LINK]
- Live demo: [PASTE IF DEPLOYED]
