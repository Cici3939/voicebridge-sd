# Judge Pitches — 3 min present + 2 min Q&A each

> STATUS Sat 2:45pm: demo works end to end (~11 sec, speaks out loud), mic button added (Chrome/Edge Web Speech API — judge can speak their own query). Bright Data live scrape still blocked on the missing `voicebridge_sd` zone — if it's still blocked at judging, show the seeded real listings + scraper logs and say so honestly.

You get a different judge per track. Don't give the same pitch to everyone. Lead with what THEY care about.

## 1. Bright Data judge — Data for Good ($1,000 / $750 / $500)
Lead: "We scrape live data to help people find free food and shelter today."
Show: `last_scraped` timestamp in Neon, the scraper log, and 2-3 real listings you scraped this weekend.
Say: "This is not mock data. Bright Data lets us pull from 211 San Diego and Feeding San Diego, and we store it with a timestamp so you know it's fresh."
Q&A prep: What sources? How often do you re-scrape? What if a site blocks you? → Answer: seed fallback + show scraper code.

## 2. Neon judge — Best Database-Driven / Agent Backend
Lead: "Everything lives in Neon Postgres, the app queries it live."
Show: `db/schema.sql`, the Neon dashboard, and `/api/resources?type=food` returning rows.
Say: "Gemini doesn't guess — it filters Neon by type and area, then summarizes only what Neon returned."
Q&A prep: Why Neon vs Firebase? → Answer: real SQL, relational + timestamps, easy to query by area/type.

## 3. ElevenLabs judge — Best Project Built with ElevenLabs
Lead: "Voice is the product, not an add-on."
Demo: Let THEM speak. Hand them the mic: "Try it — say you need a clinic near City Heights."
Let ElevenLabs speak the answer. That's your whole demo.
Say: "This is for people who can't read English well or can't see a screen well. The voice IS the accessibility."
Q&A prep: Which voice/model? → eleven_multilingual_v2, stability 0.5. Why voice over text? → literacy + vision + crisis.

## 4. Gemini judge (MLH) — Best Use of Gemini API
Lead: "Gemini does the understanding and the plain-language summary."
Show: the parseQuery prompt + the summarize prompt in `lib/voicebridge.ts`.
Say: "Gemini turns 'I need free food near La Jolla' into {type: food, area: La Jolla} and then turns 3 database rows into one 80-word spoken answer a 6th-grader can follow."
Q&A prep: Which model? → gemini-3.8-flash via Google AI Studio. Why Gemini? → fast, good at structured parsing + summarization.

## 5. Best Overall / Most Innovative judge
Lead: "Real problem, working demo, live data."
Do the full 30-second voice demo first, then the tech stack in 30 seconds.
Say: "Solo, in 26 hours, with live data, a real database, and voice as the interface."

## General tips
- Be at your table the whole 12:30-2:30 window. Solo = no missing teammate = no zero.
- If a demo step fails, say so and show the fallback — judges love honesty + a working fallback.
- End every pitch with: "Want to try it yourself?"
