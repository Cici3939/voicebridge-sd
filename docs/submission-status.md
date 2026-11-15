# Submission status — Sat Nov 14, 7:56 PM (America/Los_Angeles)

Checked this run against the live repo copy in this workspace and the
main-chat record. The SpaceXSI paragraph in the Devpost draft is TRUE.
Two claims are still not true yet: live Bright Data scrape, and a
successful live Gemini call.

## What works right now
- End-to-end demo confirmed ~2:11 PM: Ask takes ~11 sec, answer speaks
  out loud via ElevenLabs. Neon has the 12 seeded resources.
- Since then: Spanish answers end to end, area chips (La Jolla /
  Downtown / City Heights), live-data footer, tel: + website links on
  cards, fade-up + pulsing-mic animations (commit 2c56d95).
- UI polish done in Cursor and merged: mission header, bigger type,
  clearer cards (branch cursor/polish-ui-mission-header, merged as
  374a83f). Cursor also made the Neon + Gemini clients lazy, so
  `next build` now passes with NO DATABASE_URL at all — verified clean
  on the merged tree, routes /, /api/ask, /api/resources present.
- Mic fix done in Cursor, awaiting merge: branch
  cursor/fix-mic-single-audio (2064d48, app/page.tsx only). Tears down
  the old recognizer before starting, keeps the full transcript across
  pauses, clears handlers so a stuck session can't block Speak; Ask
  stops the mic first, then fetches; autoplay and the on-page player
  are now the same <audio> element so replay won't stack a second
  voice; chips only fill the box, pills/tags aren't clickable.
- Voice sprint is therefore mostly done early; tonight is build check +
  the gates only Cici can clear (below).
- GitHub: https://github.com/Cici3939/voicebridge-sd — latest commit
  bcccdfc (spacexsi-setup.md corrected). The mic-fix merge will move
  it forward once Cici merges + pushes.
- `docs/devpost-draft.md`, `docs/video-script.md`,
  `docs/judge-pitches.md`, `docs/pitch-30sec.md`, README.md and
  `docs/spacexsi-setup.md` are all refreshed to the ~5:20–5:25pm
  state. Start from those — do not rewrite from scratch.

## The "9 vs 12" question — solved, not a bug in the data
- The database has 12 resources (4 food, 4 shelter, 4 clinic — see
  data/seed.json). The footer showed 9 because `getResources` has a
  `LIMIT 3` per type, and the footer adds 3+3+3. The 4th row of each
  type is in Neon, just never shown.
- Verify in the Neon SQL Editor:
  `SELECT type, COUNT(*) FROM resources GROUP BY type;` — expect 4, 4, 4.
- Cursor was given a task to make the footer show the true total
  (a real count, not the LIMIT 3 rows). The demo itself only ever
  shows 3 per type, which is by design so the answer stays short.

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
  running and has done real work: ran the Gemini test script, did the
  UI polish (merged 374a83f), the mic fix + VoiceTide art (merged
  68d6489, build verified clean).
- Grok Bot CONFIRMED working ~5:10 PM: it triaged issue #1 (Bright
  Data scrape 400) — created the `data` label, posted a fix plan as an
  issue comment (verified live on GitHub, comment 6887126309). Its plan
  matched Muse's diagnosis exactly. Cici also set it to check the repo
  on a schedule from Sat evening until Sun 1:00 PM.
- `docs/devpost-draft.md` SpaceXSI paragraph was rewritten in commit
  704fc51 to match this reality. Remaining SpaceXSI bit: tick the
  raffle box on Devpost at submission time.

## Bright Data — zone FIXED ~7:55 PM, extraction now the bottleneck
- Scrape run ~1:55 PM: all 3 sources failed identically
  "Bright Data failed: 400", 0 listings upserted. Diagnosis: the Web
  Unlocker zone `voicebridge_sd` did not exist yet (a bad key would be
  401). Grok Bot's independent triage of issue #1 reached the same
  conclusion.
- ~7:55 PM: Cici created the zone and reran `npm run scrape`. The 400
  is GONE — all 3 sources fetch cleanly now. But every source returned
  "Extracted 0 listings / Upserted 0". The extraction step
  (`extractListingsFromHtml`) uses Gemini to read the HTML, and Gemini
  has been 503ing / hanging all day — that is the likely cause.
- Next check: run `npx tsx scripts/test-gemini.ts`. If it prints OK,
  rerun `npm run scrape` — extraction may just work. If it fails, stop
  chasing it: the demo runs on the 12 seeded Neon rows, and the scrape
  running clean (no errors) is still a good thing to show the Bright
  Data judge. Do NOT claim "live scraped today" in the video unless a
  scrape actually upserts listings.
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

## Tonight — Sat 7:56–10:00 PM run order
1. Mic fix + VoiceTide are MERGED (68d6489, build verified clean).
   Still to do: `git pull origin main` in the INNER folder, restart
   dev (port 3001), test.
2. Bright Data zone is CREATED and the 400 is fixed. Scrape runs but
   extracts 0 — retry it only after the Gemini test prints OK.
   Otherwise seeded data carries the demo; show the clean scrape logs
   to the Bright Data judge instead.
3. Test 3x — food + shelter + clinic — plus mic in Chrome (transcript
   survives pauses, replay plays one voice) and one Spanish question
   ("Necesito comida gratis cerca de La Jolla"). Retry the Gemini test.
4. Dinner was served EARLY (5:30 PM) — already eaten. The 7:30–8:30
   slot is free: use it to practice the 30-sec pitch out loud
   (`docs/pitch-30sec.md`).
5. Voice sprint (now–10:00 PM) is mostly done already (TTS + mic +
   fallback audio + single-audio fix); use the slot for bug fixes only,
   then commit + push before the 10:00 PM space close. No new features
   after 10 PM.
6. Sun: video 10:00–11:00 AM, initial Devpost by 11:00 AM, final by
   12:00 PM, judging 12:30–2:30 PM. No commits after Sun 12:00 PM.
