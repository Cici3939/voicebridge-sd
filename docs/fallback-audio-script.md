# Fallback Audio Script — Use if live ElevenLabs TTS fails

> DONE Sat 2:45pm: all 3 takes are recorded as MP3s in `public/fallback-audio/` (food.mp3, shelter.mp3, clinic.mp3) and wired into `app/page.tsx` — when `/api/ask` returns no audio, the page plays the matching file for the query type and shows a small "pre-recorded answer" note. Re-record with ElevenLabs later only if you want the ElevenLabs voice instead.

## Take 1 — Food near La Jolla (use for video + live demo backup)
"Closest option is the San Diego Food Bank, at 9850 Distribution Avenue in San Diego. Check their website for today's distribution hours. You can also call 211 any time for free help in San Diego County."

## Take 2 — Shelter Downtown
"Closest shelter is Father Joe's Villages, at 1501 Imperial Avenue in Downtown San Diego. Check their website for intake hours, or call 619-233-8500."

## Take 3 — Clinic City Heights
"Closest clinic is La Maestra Community Health Centers in City Heights, at 4060 Fairmount Avenue. They offer low-cost care. Call 619-280-4213 for hours."

## How to use
- Save each as MP3 in `public/fallback-audio/`
- In `app/page.tsx`, if `audioBase64` is null, play the matching fallback file instead of showing an error
- Never show a blank screen — judges score demo, not perfection
- Verify addresses/hours against Neon seed data before recording final take
