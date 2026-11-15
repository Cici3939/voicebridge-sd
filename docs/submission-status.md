# Submission status — Sat Nov 14, 5:15 PM (America/Los_Angeles)

Checked this run against the live repo copy in this workspace and the
main-chat record. The SpaceXSI paragraph in the Devpost draft is now
TRUE (confirmed below). Two claims are still not true yet: live Bright
Data scrape, and a successful live Gemini call.

## What works right now
- End-to-end demo confirmed ~2:11 PM: Ask takes ~11 sec, answer speaks
  out loud via ElevenLabs. Neon has the 12 seeded resources.
- Since then: Spanish answers end to end, area chips (La Jolla /
  Downtown / City Heights), live-data footer (resource count + newest
  last_scraped), tel: + website links on cards, fade-up + pulsing-mic
  animations — pushed as commit 2c56d95. Voice sprint is therefore
  mostly done early; tonight is build check + the gates only Cici can
  clear (below).
- Build re-verified 5:15 PM on the workspace copy at HEAD 704fc51:
  with a dummy DATABASE_URL it compiles clean, routes /, /api/ask,
  /api/resources present. (Without any DATABASE_URL the build fails at
  page-data collection for /api/ask — expected in this copy, which has
  no .env.local; her laptop has the real one, so it builds there.)
- `docs/devpost-draft.md` and `docs/video-script.md` already exist, plus
  `docs/judge-pitches.md` and `docs/pitch-30sec.md`. Start from those —
  do not rewrite from scratch.
- GitHub: https://github.com/Cici3939/voicebridge-sd — latest commit
  704fc51 (Devpost draft: SpaceXSI paragraph rewritten to match reality,
  Gemini note updated with the 503 test result).

## Gemini — yes, planned and in the code, but not live in the demo
- `lib/voicebridge.ts`: `parseQuery` + `summarizeResources` call
  `gemini-3.8-flash`. That is the Gemini track claim.
- Live behaviour ~2:08–2:11 PM: BOTH Gemini calls hit their timeout and
  fell back (keyword parsing + template summary). The demo still works
  and speaks, but Gemini did not produce the live answer.
- Test run in Cursor ~5:04 PM: `npx tsx scripts/test-gemini.ts`
  FAILED after 11,063 ms with 503 Service Unavailable — the model is
  experiencing high demand, temporary per Google. Not wifi, not the key,
  not a code bug: the request reached Google and Google answered.
- Before the video / Gemini judge pitch, either get a Gemini call to
  return OK (retry the test script later), or be honest that the
  fallback carried the demo. Do not claim in the video that Gemini
  summarized that exact answer unless a live call is observed doing so.

## SpaceXSI — CONFIRMED DONE (~5:10 PM)
- Qualification is workflow-based: Cursor as core AI coding agent +
  Grok Bot automation, describe both in Devpost, opt in to the raffle
  (mechanical keyboard).
- Promo redeemed ~4:56 PM (free month of X Premium). Cursor Pro is
  running and has done real work: it ran the Gemini test script in
  Cursor's terminal. UI polish was assigned to Cursor's agent next
  (bigger type, clearer cards, mission header) — confirm what it changed
  when it reports back, then commit + push from Cursor.
- Grok Bot CONFIRMED working ~5:10 PM: it triaged issue #1 (Bright
  Data scrape 400) — created the `data` label, posted a fix plan as an
  issue comment (Cici said yes to posting). Its plan matched Muse's
  diagnosis exactly, and it suggested one hardening step: include
  `await res.text()` in the thrown error so Bright Data's own reason
  shows in the logs. Good next Cursor task.
- `docs/devpost-draft.md` SpaceXSI paragraph was rewritten in commit
  704fc51 to match this reality. Remaining SpaceXSI bit: tick the
  raffle box on Devpost at submission time.

## Bright Data — the one gate only Cici can clear
- Scrape run ~1:55 PM: all 3 sources failed identically
  "Bright Data failed: 400", 0 listings upserted. Diagnosis: the Web
  Unlocker zone `voicebridge_sd` most likely does not exist yet
  (a bad key would be 401). Grok Bot's independent triage of issue #1
  reached the same conclusion.
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
1. Create the Bright Data zone `voicebridge_sd`, then `npm run scrape`.
   ~10 min. If the scrape still 400s, stop chasing it — seeded data
   carries the demo; show scraper logs to the Bright Data judge instead.
2. In Cursor: UI polish (prompt already given) + retry the Gemini test
   later (503 may clear). Commit + push from Cursor.
3. `git pull origin main`, restart dev (inner folder, port 3001), test
   3x — food + shelter + clinic — plus mic in Chrome and one Spanish
   question ("Necesito comida gratis cerca de La Jolla").
4. 7:30–8:30 PM dinner (free) — practice the 30-sec pitch out loud
   (`docs/pitch-30sec.md`).
5. 8:30–10:00 PM voice sprint is mostly done already (TTS + mic +
   fallback audio); use the slot for bug fixes only, then commit +
   push before the 10:00 PM space close. No new features after 10 PM.
6. Sun: video 10:00–11:00 AM, initial Devpost by 11:00 AM, final by
   12:00 PM, judging 12:30–2:30 PM. No commits after Sun 12:00 PM.
