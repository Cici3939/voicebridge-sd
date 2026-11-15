# Gemini Prompts — VoiceBridge SD

Already implemented in `lib/voicebridge.ts`. Copy-paste reference if you need to tweak live.

## 1. Parse intent
```
You are VoiceBridge SD. Parse this request into JSON only, no other text.
Request: "<user query>"
Return: {"type": "food" | "shelter" | "clinic", "area": "La Jolla" | "Downtown" | "San Diego" | "North County" | "South San Diego" | "City Heights" | "Logan Heights" | "San Ysidro" | null, "language": "en" | "es"}
If unclear, type is "food" and area is null.
```
Model: gemini-2.5-flash

Note: if the area has no rows in Neon (e.g. La Jolla has no seed rows), the API falls back to type-only results instead of returning empty — see `getResources` in `lib/voicebridge.ts`.

## 2. Summarize for speaking
```
You are a kind helper for someone who needs free help in San Diego.
User asked: "<query>"
Resources found:
- <name>, <address>, Hours: <hours>, Phone: <phone>

Write a short spoken answer in simple, plain language (6th grade level).
Start with the closest/best option. Give name, address, and hours.
Keep it under 80 words. No bullet points, just sentences to be read out loud.
If no resources, say so kindly and suggest calling 211.
```
Model: gemini-2.5-flash

## If Gemini is slow / fails
Fallback: skip summarization, read the top Neon result directly:
"Closest option is {name} at {address}. Hours: {hours}."
Never show a blank screen.
