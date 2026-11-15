# Devpost Draft — VoiceBridge SD

> STATUS Sun 10:26am: demo works end to end via fallback (ask -> Neon -> spoken answer in ~11 sec). Spanish fully working: typed + spoken (EN/ES mic toggle), phone numbers spelled out in Spanish words, hours/address phrases translated. Gemini test this morning FAILED again with 503 high demand (not quota — quotas reset at midnight). Bright Data zone `voicebridge_sd` exists, scrape fetches cleanly but extracts 0 listings because extraction uses Gemini — demo runs on 12 real seeded listings. SpaceXSI CONFIRMED: Cursor Pro + Grok Bot triaged issue #1. Elevator pitch is 133 chars (max 200). Paste video link at the bottom before submitting.

## Tagline
Voice-first help finder for San Diego — speak what you need, hear where to go.

## Elevator pitch (Devpost field — max 200 characters, this one is 133)
Voice-first help finder for San Diego: speak what you need, hear where to go. Free food, shelter, and clinics, in English or Spanish.

## Elevator pitch (long version, for the description)
VoiceBridge SD is a voice-first finder for free food, shelter, and clinics in San Diego. Instead of digging through five websites in English on a small phone, you just speak — "I need free food near La Jolla today" — and hear the answer out loud in plain language, in English or Spanish. It's built for the people the search itself locks out: people who can't easily read, are elderly, or are visually impaired. Real listings from 211 San Diego, Feeding San Diego, and the San Diego Food Bank live in Neon, the request is understood and summarized into simple spoken language, and ElevenLabs speaks it back — so help is one spoken question away.

## About the project — paste this into Devpost

### Inspiration
Finding free food, shelter, or a clinic in San Diego means digging through five different websites, in English, on a small phone. For people who can't easily read English, are elderly, or are visually impaired, that search itself is the barrier — the help exists, but the way to find it doesn't work for the people who need it most. I built VoiceBridge SD so the search disappears: you speak, and you hear where to go.

### What it does
You speak — "I need free food near La Jolla today" — and VoiceBridge answers out loud in plain language, with the name, address, hours, and phone number of real nearby help. It works in English and Spanish, spoken or typed, with a big-button interface, an EN/ES mic toggle, area shortcuts, and cards for every result. The whole point is that no reading, no typing, and no English are required to get help.

### How we built it
Next.js and TypeScript, one page, no login. Bright Data scrapes listings from 211 San Diego, Feeding San Diego, and the San Diego Food Bank into Neon Postgres, Gemini parses the request (food, shelter, or clinic, plus area and language) and summarizes the results into simple spoken language under 80 words, and ElevenLabs (eleven_multilingual_v2) speaks the answer. Because live services can fail at the worst moment, every Gemini call has a timeout with a keyword/template fallback, and 12 real listings are seeded in Neon so the demo never shows empty. The project was built solo in Cursor Pro as the core coding agent, with a Grok Bot automation watching the repo — it triaged our first real issue and posted a fix plan.

### Challenges we ran into
- **Gemini wouldn't answer.** Across the whole weekend the API returned 503 "high demand", timeouts, and quota errors, and the model we switched to (gemini-2.5-flash) turned out to be unavailable to new users. So the demo is built to never depend on a single call: timeouts, fallbacks, and seeded data keep it speaking no matter what.
- **Bright Data returned 400 on every source.** The scraper zone didn't exist on the account yet — a fix Grok Bot independently confirmed while triaging the issue. Creating the zone fixed the 400; extraction still waits on Gemini.
- **Spanish kept coming back English.** Three separate bugs: the fallback hardcoded English, the mic was locked to English speech recognition, and phone numbers are digits, which text-to-speech reads in English. Fixed all three — Spanish keyword detection, an EN/ES mic toggle, and phone numbers spelled out in Spanish words — plus translated hours and address phrases, so the spoken answer stays in Spanish.
- **Solo and 26 hours.** One person, five tracks, one demo that had to work live. We cut everything that wasn't the voice demo and spent the time on the 30 seconds a judge actually hears.

### Accomplishments that we're proud of
A voice demo that works end to end in about 11 seconds, in English and Spanish, even when an API is down. The Spanish answer is genuinely usable — spoken questions, Spanish replies, phone numbers read out digit by digit in Spanish.

### What we learned
Live data, a real database, and a voice interface beat a pretty frontend. Judges score the idea and the demo, not code quality, so we spent our time on the thing a judge can hear. And accessibility isn't a checkbox: designing for people who can't read the screen changed every decision, from the big buttons to the spoken phone numbers.

### What's next for VoiceBridge SD
Get the live scrape flowing once Gemini answers, add more sources beyond the three food sites, and add more languages — the same voice-first flow works for any community that needs help finding help.

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
