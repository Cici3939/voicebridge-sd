# Submission status — Sat Nov 14, 2:33 PM (America/Los_Angeles)

Checked this run against the live repo copy in this workspace and the
main-chat record. Do NOT submit the Devpost draft as-is — two claims in it
are not true yet (see below).

## What works right now
- End-to-end demo confirmed ~2:11 PM: Ask takes ~11 sec, answer speaks
  out loud via ElevenLabs. Neon has the 12 seeded resources.
- `docs/devpost-draft.md` and `docs/video-script.md` already exist, plus
  `docs/judge-pitches.md`. Start from those — do not rewrite from scratch.
- GitHub: https://github.com/Cici3939/voicebridge-sd — latest commit b385d24 (README polish); fallback-audio + mic button landed in aeffa94 / afb49f3.

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

## SpaceXSI — yes, planned, NOT set up yet
- Qualification is workflow-based: Cursor as core AI coding agent +
  Grok Bot automation, describe both in Devpost, opt in to the raffle
  (mechanical keyboard).
- No Cursor Pro / Grok Bot setup has been confirmed. The workshop is
  TODAY Sat 2:45–3:15 PM, WLH 2207 — leave ~2:35, bring laptop, ask the
  MLH Coach for the X Premium promo code if Cici has none in email.
- `docs/devpost-draft.md` currently describes the Grok Bot automation in
  the present tense ("Grok Bot watches our repo… We used Cursor + Grok
  Bot throughout the weekend"). That is aspirational, not done — fix
  that paragraph after the workshop, before submitting.

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

## Next-hours split (from Cici's 2:33 PM message)
- Cici: 2:45 SpaceXSI workshop; create the Bright Data zone; rerun scrape.
- Muse: while she is at the workshop, fix the two Devpost claims above,
  tighten the video script to what the demo actually does, and keep
  working the data sprint (scraper code is ready in `scripts/scrape.ts` —
  it only needs the zone to exist).
