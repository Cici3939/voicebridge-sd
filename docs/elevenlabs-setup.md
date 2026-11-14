# ElevenLabs Setup — VoiceBridge SD

## Claim Creator tier (for SanD Hacks)
1. Go to ElevenLabs dashboard — sign in with the same email you used for the hackathon
2. Look for the SanD Hacks Creator tier offer — Devpost says "All participants receive Creator tier credits"
3. If you don't see a claim link, check:
   - SanD Hacks Slack for an ElevenLabs link/code
   - Devpost → your project → prizes / perks
   - Ask at the ElevenLabs table / Help Desk
4. You don't need Scale tier to build — Creator tier is enough for the demo. Scale tier is the WINNER prize.

## Get what you need for `.env.local`
1. Dashboard → Profile / API Keys → Create API key → copy to `.env.local` as `ELEVENLABS_API_KEY=`
   - Never paste this key in chat
2. Voices → pick a clear, warm voice you like → copy its Voice ID → `.env.local` as `ELEVENLABS_VOICE_ID=`
   - Good default: a natural US English voice, multilingual if you want Spanish later
   - Our code uses model `eleven_multilingual_v2`

## Test it in 2 minutes
- In the ElevenLabs playground, paste: "Closest option is the San Diego Food Bank, at 9850 Distribution Avenue in San Diego."
- Play it. If it sounds clear and not robotic, that's your voice.
- If TTS fails during the hackathon, use the fallback audio script in `docs/fallback-audio-script.md` — never show a blank screen.

## For judging
- Let the judge speak — hand them the mic. That's your ElevenLabs demo.
- Say: "Voice is the product, not an add-on — this is for people who can't read English well or can't see a screen well."
