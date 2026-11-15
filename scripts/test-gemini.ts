// Cursor task #1 — Test live Gemini (20 min)
// Run in Cursor's terminal, from the inner voicebridge-sd folder:
//   npx tsx scripts/test-gemini.ts
// This calls gemini-2.5-flash directly (no Neon, no TTS) and prints
// exactly what came back and how long it took. If it returns JSON in
// under ~15s, a live Gemini call works and we can honestly claim it to
// the Gemini judge. If it times out / errors, the keyword fallback
// carries the demo and the Devpost/video must say so.
import '../lib/env';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-2.5-flash';
const QUERY = process.argv[2] || 'I need free food near La Jolla today';

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms),
    ),
  ]);
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('No GEMINI_API_KEY in .env.local — add it first.');
    process.exit(1);
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `Parse this request into JSON only, no other text.\nRequest: "${QUERY}"\nReturn: {"type": "food" | "shelter" | "clinic", "area": "La Jolla" | "Downtown" | "San Diego" | "North County" | "South San Diego" | "City Heights" | "Logan Heights" | "San Ysidro" | null, "language": "en" | "es"}`;
  const start = Date.now();
  try {
    const result = await withTimeout(model.generateContent(prompt), 15000);
    const ms = Date.now() - start;
    const text = result.response.text().trim();
    console.log(`LIVE GEMINI OK in ${ms}ms (model ${MODEL})`);
    console.log('Raw reply:', text);
    try {
      console.log('Parsed:', JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch {
      console.log('NOTE: reply was not clean JSON — the app fallback would still work, but check the prompt.');
    }
  } catch (e: any) {
    console.log(`LIVE GEMINI FAILED after ${Date.now() - start}ms: ${e?.message || e}`);
    console.log('That means the demo falls back to keyword parsing — do not claim a live Gemini answer until this script prints OK.');
    process.exit(1);
  }
}

main();
