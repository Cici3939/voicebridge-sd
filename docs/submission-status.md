# Submission status — Sat Nov 14, 4:33 PM (America/Los_Angeles)

Checked this run against the live repo copy in this workspace and the
main-chat record. Do NOT submit the Devpost draft as-is — two claims in it
are not true yet (see below).

## What works right now
- End-to-end demo confirmed ~2:11 PM: Ask takes ~11 sec, answer speaks
  out loud via ElevenLabs. Neon has the 12 seeded resources.
- Since then, while Cici was at the social / Gilder Port: Spanish answers
  end to end, area chips (La Jolla / Downtown / City Heights), live-data
  footer (resource count + newest last_scraped), tel: + website links on
  cards, fade-up + pulsing-mic animations — pushed as commit 2c56d95.
  Voice sprint is therefore mostly done early; tonight is build check +
  the two gates only Cici can clear (below).
- Build re-verified 4:33 PM on the workspace copy: with a dummy
  DATABASE_URL it compiles clean, routes /, /api/ask, /api/resources
  present. (Without any DATABASE_URL the build fails at page-data
  collection for /api/ask — expected in this copy, which has no
  .env.local; her laptop has the real one, so it builds there.)
- `docs/devpost-draft.md` and `docs/video-script.md` already exist, plus
  `docs/judge-pitches.md` (status header refreshed 4:33 PM with the
  Spanish note). Start from those — do not rewrite from scratch.
- GitHub: https://github.com/Cici3939/voicebridge-sd — latest commit
  2c56d95. This status file + judge-pitches update are local-only until
  pushed.

## Gemini — yes, planned and in the code, but not live in the demo
- `lib/voicebridge.ts`: `parseQuery` + `summarizeResources` call
  `gemini-3.8-flash`. That is the Gemini track claim.
- Live behaviour ~2:08–2:11 PM: BOTH Gemini calls hit their timeout and
  fell back (keyword parsing + template summary). The demo still works
  and speaks, but Gemini did not produce the live answer.
- Before the video / Gemini judge pitch, either get a Gemini call to
  return in under 5s, or be honest that the fallback carried the demo.
  Do not claim in the video that Gemini summarized that exact answer
  unless a live call is observed doing so.

## SpaceXSI — promo code GOT (~4:06 PM), setup still NOT done
- Qualification is workflow-based: Cursor as core AI coding agent +
  Grok Bot automation, describe both in Devpost, opt in to the raffle
  (mechanical keyboard).
- Cici got the promo code at ~4:06 PM, but as of 4:33 PM she has NOT
  confirmed redeeming it, and no Cursor Pro / Grok Bot setup has been
  confirmed. Do this FIRST when back at the laptop, before any more
  coding: redeem the free month of X Premium via the email claim link,
  claim Cursor Pro through the X Premium benefit, download Cursor,
  open voicebridge-sd in Cursor, switch on the Grok Bot automation
  (auto-summarize-scrapes). Only then do the remaining coding in Cursor.
- `docs/devpost-draft.md` currently describes the Grok Bot automation in
  the present tense ("Grok Bot watches our repo… We used Cursor + Grok
  Bot throughout the weekend"). That is aspirational, not done — fix
  that paragraph after setup is confirmed, before submitting.
- Note: the Spanish / chips / footer work in commit 2c56d95 was done by
  Muse while Cici was out, NOT in Cursor. The Cursor tasks still to do
  in Cursor are #1 (run `npx tsx scripts/test-gemini.ts`) and #2
  (check /api/resources?type=food returns live Neon rows) — doing those
  two in Cursor is what makes the Cursor claim real.

## Bright Data — the one gate only Cici can clear
- Scrape run ~1:55 PM: all 3 sources failed identically
  "Bright Data failed: 400", 0 listings upserted. Diagnosis: the Web
  Unlocker zone `voicebridge_sd` most likely does not exist yet
  (a bad key would be 401).
- Fix, on her laptop/dashboard only: brightdata.com/cp/zones →
  create a Web Unlocker zone named exactly `voicebridge_sd`, then
  `npm run scrape`. Until that rerun succeeds, the demo runs on the
  12 seeded Neon rows — so the video must not claim "live scraped
  today" unless a scrape actually succeeds.
- `docs/devpost-draft.md` says "This is not mock data — it's live web
  data" — true only after a successful scrape. Same caveat for the
  video script line "This is live data from today, not fake data."

## Devpost draft — placeholders still open
- Repo link: filled in (https://github.com/Cici3939/voicebridge-sd)
- Video link: missing — record Sun 10:00–11:00 AM, upload Public
- Live demo link: missing / optional
- Impact prizes: $1,000 / $750 / $500 are Bright Data API credits,
  not cash (Slack correction) — do not call them cash to judges.

## Deadlines (Sun Nov 15)
- Initial Devpost: 11:00 AM (placeholder fine)
- Final Devpost: 12:00 PM, no changes after; no commits after 12:00 PM
- Judging: 12:30–2:30 PM, Qualcomm Room, 3 min + 2 min Q&A per judge

## Tonight — Sat 5:00–10:00 PM run order (do the gates first)
1. 5:00 PM — redeem promo → Cursor Pro + Grok Bot (above). ~15 min.
2. Create the Bright Data zone `voicebridge_sd`, then `npm run scrape`.
   ~10 min. If the scrape still 400s, stop chasing it — seeded data
   carries the demo; show scraper logs to the Bright Data judge instead.
3. In Cursor: task #1 Gemini test, task #2 /api/resources check.
4. `git pull origin main`, restart dev (inner folder, port 3001), test
   3x — food + shelter + clinic — plus mic in Chrome and one Spanish
   question ("Necesito comida gratis cerca de La Jolla").
5. 7:30–8:30 PM dinner (free) — practice the 30-sec pitch out loud
   (`docs/pitch-30sec.md`).
6. 8:30–10:00 PM voice sprint is mostly done already (TTS + mic +
   fallback audio); use the slot for bug fixes only, then commit +
   push before the 10:00 PM space close. No new features after 10 PM.
7. Sun: video 10:00–11:00 AM, initial Devpost by 11:00 AM, final by
   12:00 PM, judging 12:30–2:30 PM. No commits after Sun 12:00 PM.
