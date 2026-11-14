import { NextResponse } from 'next/server';
import { parseQuery, getResources, summarizeResources, speakText } from '@/lib/voicebridge';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

    // 1. Gemini parses intent
    console.log('[ask] parse start');
    const parsed = await parseQuery(query);
    console.log('[ask] parsed:', parsed);
    // 2. Neon lookup
    console.log('[ask] neon start');
    const resources = await getResources(parsed.type, parsed.area);
    console.log('[ask] neon done, rows:', resources.length);
    // 3. Gemini summarizes to plain spoken language
    console.log('[ask] summarize start');
    const answer = await summarizeResources(query, resources as any[]);
    console.log('[ask] summarize done');
    // 4. ElevenLabs speaks it — return audio as base64 so the frontend can play it instantly
    // If ElevenLabs fails, still return text answer so the demo never dies
    let audioBase64: string | null = null;
    try {
      console.log('[ask] tts start');
      const audio = await speakText(answer);
      audioBase64 = Buffer.from(audio).toString('base64');
      console.log('[ask] tts done');
    } catch (e) {
      console.error('ElevenLabs failed, returning text only', e);
    }

    return NextResponse.json({ answer, resources, audioBase64, parsed });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'ask failed' }, { status: 500 });
  }
}
