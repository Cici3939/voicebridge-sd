# Judge Pitches — 3 min present + 2 min Q&A each

> STATUS Sat 7:59pm: demo works end to end (~11 sec, speaks out loud), mic button fixed + VoiceTide interactive art merged (build verified clean), Spanish answers + area chips + live-data footer added (test the Spanish question before claiming it to judges). Bright Data zone `voicebridge_sd` CREATED — the 400 is fixed and the scrape runs, but it extracts 0 listings because Gemini's free-tier quota (20/day) is exhausted (429) — extraction uses Gemini too. Second Gemini key in a new project is being made tonight for a fresh 20; otherwise the quota resets ~midnight. SpaceXSI CONFIRMED: promo redeemed, Cursor Pro ran the Gemini test + UI polish + mic fix + VoiceTide, Grok Bot triaged issue #1 and posted the fix plan.

You get a different judge per track. Don't give the same pitch to everyone. Lead with what THEY care about.

## 1. Bright Data judge — Data for Good ($1,000 / $750 / $500)
Lead: "We scrape live data to help people find free food and shelter today."
Show: `last_scraped` timestamp in Neon, the scraper log, and 2-3 real listings — scraped ones if the scrape upserts any, otherwise the 12 seeded real listings + the clean scrape log (no errors since the zone was created).
Say: "This is not mock data. Bright Data lets us pull from 211 San Diego and Feeding San Diego, and we store it with a timestamp so you know it's fresh."
Q&A prep: What sources? How often do you re-scrape? What if a site blocks you? → Answer: seed fallback + show scraper code. (Grok Bot independently triaged the original 400 and reached the same diagnosis — the zone was missing, not the code. The zone is now created; if the scrape still shows 0 listings, it's the Gemini quota, not the scraper.)

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
Spanish bonus (only if the Spanish test passes tonight): ask "Necesito comida gratis cerca de La Jolla" and let it answer in Spanish — same pipeline, eleven_multilingual_v2 speaks it.
Q&A prep: Which voice/model? → eleven_multilingual_v2, stability 0.5. Why voice over text? → literacy + vision + crisis.

## 4. Gemini judge (MLH) — Best Use of Gemini API
Lead: "Gemini does the understanding and the plain-language summary."
Show: the parseQuery prompt + the summarize prompt in `lib/voicebridge.ts`.
Say: "Gemini turns 'I need free food near La Jolla' into {type: food, area: La Jolla} and then turns 3 database rows into one 80-word spoken answer a 6th-grader can follow."
Q&A prep: Which model? → gemini-3.8-flash via Google AI Studio. Why Gemini? → fast, good at structured parsing + summarization.
Honesty note: live Gemini calls have failed so far — the ~7:57pm test got a 429 "quota exceeded" (free tier is 20 requests/day, used up by testing + scrapes; resets ~midnight), and before that a 503 "high demand" plus timeouts, so the keyword/template fallback carried the demo. A second key in a new project is being made tonight for a fresh 20. Only claim Gemini produced a specific answer after a live call is observed returning OK (retry `npx tsx scripts/test-gemini.ts` in Cursor). Sunday budget: each Ask = 2 requests, so save them for the video + judging demos.

## 5. Best Overall / Most Innovative judge
Lead: "Real problem, working demo, real data."
Do the full 30-second voice demo first, then the tech stack in 30 seconds.
Say: "Solo, in 26 hours, with live data, a real database, and voice as the interface."

## General tips
- Be at your table the whole 12:30-2:30 window. Solo = no missing teammate = no zero.
- If a demo step fails, say so and show the fallback — judges love honesty + a working fallback.
- End every pitch with: "Want to try it yourself?"
