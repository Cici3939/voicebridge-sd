# Get a Gemini API Key in 2 Minutes — Skip the 2:00 Workshop

You don't need the 2:00-2:30 Google AI Studio workshop for this.

## Steps
1. Go to https://aistudio.google.com/api-keys
   - Or start at https://mlh.link/aistudio → click "Get an API key" → it goes to the same page
2. Sign in with your Google account (use your UCSD / personal Google — same one you'll use for the demo)
3. Click **Create API key**
4. Choose **Create API key in new project** (easiest)
5. Copy the key — it starts with `AIza...`
6. Paste into `.env.local` as:
   ```
   GEMINI_API_KEY=AIza...
   ```
7. Test in code: `parseQuery("I need free food near La Jolla")` should return JSON with type=food

## If it fails
- "API not enabled"? Go to Google Cloud Console → Enable Generative Language API for that project, then retry.
- Quota error? You're on free tier — gemini-2.5-flash is the cheapest/fastest for this. Don't use Gemini 3 Pro for the demo.
- Don't commit `.env.local` — it has secrets.

## What this unlocks
- Best Use of Gemini API (MLH Swag Kits)
- Our brain: intent parsing + plain-language summary in `lib/voicebridge.ts`
