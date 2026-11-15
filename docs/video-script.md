# 3-Minute Video Script — VoiceBridge SD

Total: 3:00. Record in one take if you can, quiet room, show your face for 10 sec then screen share.

## 0:00-0:30 — Problem (Cici to camera)
"Finding free food or shelter in San Diego shouldn't be hard, but it is. You have to dig through five websites, in English, on your phone. If you can't read English well, or you can't see the screen well, that search is the barrier. So we built VoiceBridge SD."

## 0:30-1:30 — Live Demo (screen share, SPEAK OUT LOUD)
Show the homepage.
Say into the mic: "I need free food near La Jolla today."
Wait ~11 seconds — let it answer out loud, don't click anything. Show the cards underneath with name, address, hours.
Then try a second one: "I need a shelter in Downtown tonight."
Show the VoiceTide art too — the waves react while you speak, and tapping a Food / Shelter / Clinic buoy fills in that example for you. Same ask, one tap — show it once, it reads as the most visual 10 seconds of the demo.
Point to the `last_scraped` time on screen — ONLY say "This is live data from today" if the scrape has actually succeeded; otherwise say "These are real listings from San Diego orgs, stored in our database."

## 1:30-2:30 — How it works (screen share code / diagram)
"Bright Data scrapes live listings from 211 San Diego and Feeding San Diego. That goes into Neon Postgres. Gemini figures out what you need and writes a simple summary. ElevenLabs speaks it out loud. We built it in Cursor with Grok Bot helping."
> ONLY say the Bright Data line as written if the scrape has actually succeeded by recording time. If it hasn't, say instead: "Bright Data is our scraper — right now the demo runs on real listings we loaded into Neon, and the scraper refreshes them once the zone is set up." The Cursor + Grok Bot line is confirmed true (Cursor ran the Gemini test; Grok Bot triaged issue #1 and posted the fix plan).
Show: Bright Data log → Neon table → Gemini prompt → ElevenLabs audio playing.
> Spanish bonus (optional, only if the Spanish answer works when you test it): ask "Necesito comida gratis cerca de La Jolla" and let it answer in Spanish — same pipeline, no extra setup.

## 2:30-3:00 — Impact + Next
"Who this helps: low-literacy, elderly, and visually-impaired people in San Diego, and anyone in a crisis who just needs a clear answer fast. It already answers in Spanish too. Next we'd add SMS and more cities. Thank you — VoiceBridge SD."
> The Spanish line is only true if the Spanish test passes tonight — cut it otherwise.

## Tips
- Record the demo twice, use the best take.
- If live TTS fails during recording, use the pre-recorded fallback audio — don't re-record the whole thing.
- Upload as Public to YouTube or Google Drive.
- Keep the video under 3:00 — Devpost wants a 3-minute video.
