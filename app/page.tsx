'use client';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [query, setQuery] = useState('I need free food near La Jolla today');
  const [answer, setAnswer] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fallbackAudio, setFallbackAudio] = useState(false);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [micStatus, setMicStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<{ count: number; updated: string | null } | null>(null);
  const recRef = useRef<any>(null);
  const wantListeningRef = useRef(false);

  useEffect(() => {
    setMicSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  // Live-data footer: count all resources across types + newest last_scraped.
  useEffect(() => {
    (async () => {
      try {
        const rows = (await Promise.all(
          ['food', 'shelter', 'clinic'].map((t) => fetch(`/api/resources?type=${t}`).then((r) => r.json())),
        )).flatMap((d) => d.resources || []);
        const updated = rows.map((r: any) => r.last_scraped).filter(Boolean).sort().pop() || null;
        setStats({ count: rows.length, updated });
      } catch { /* footer stays hidden; the demo doesn't depend on it */ }
    })();
  }, []);

  // Browser speech-to-text (Web Speech API, Chrome/Edge). Fills the input
  // with what the user said — they still tap "Ask out loud" to get the
  // spoken answer, so a mic failure can never break the demo.
  //
  // Fixed Sat 3:40pm: the old version stopped silently the moment Chrome
  // paused or hit an error (no-speech / mic blocked), so "Speak" looked
  // like it "ended right after clicking" with no explanation. Now it
  // keeps listening across pauses (continuous + interim results), shows
  // live status, and explains exactly what went wrong.
  function listen() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      const heard = (finalText || interimText).trim();
      if (heard) {
        setQuery(heard);
        setMicStatus(finalText ? 'Heard you — tap "Ask out loud" to get the answer.' : 'Listening… keep talking.');
      }
    };
    rec.onend = () => {
      // Chrome ends a session after a pause even in continuous mode —
      // restart while the user still wants to talk, so it never looks
      // like it died right after clicking.
      if (wantListeningRef.current) {
        try { rec.start(); return; } catch { /* already started */ }
      }
      setListening(false);
    };
    rec.onerror = (e: any) => {
      const code = e?.error || 'unknown';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        wantListeningRef.current = false;
        setListening(false);
        setMicStatus('Microphone is blocked — click the tune/lock icon in Chrome\'s address bar → Site settings → Microphone → Allow, then reload and tap Speak again.');
      } else if (code === 'audio-capture') {
        wantListeningRef.current = false;
        setListening(false);
        setMicStatus('No microphone found — check the mic is plugged in / selected, then tap Speak again.');
      } else if (code === 'no-speech') {
        setMicStatus('Didn\'t hear anything — speak a little louder and closer to the mic. Still listening…');
      } else if (code === 'aborted') {
        // User tapped Stop; not an error.
      } else {
        setMicStatus(`Mic error (${code}) — tap Speak again, or just type and tap "Ask out loud".`);
      }
    };
    wantListeningRef.current = true;
    setListening(true);
    setMicStatus('Listening… speak now — tap Stop when you\'re done.');
    try {
      rec.start();
    } catch {
      // start() throws if a previous session is still winding down.
      setTimeout(() => { try { rec.start(); } catch { setListening(false); } }, 250);
    }
  }

  function stopListening() {
    wantListeningRef.current = false;
    try { recRef.current?.stop(); } catch { /* already stopped */ }
    setListening(false);
    setMicStatus((s) => (s && s.startsWith('Heard you') ? s : 'Stopped listening — tap "Ask out loud" to get the answer.'));
  }

  async function ask() {
    setLoading(true);
    setAnswer('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
      const data = await res.json();
      setAnswer(data.answer || data.error || 'Sorry, I could not find anything. Try calling 211.');
      setResources(data.resources || []);
      if (data.audioBase64) {
        const blob = new Blob([Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0))], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setFallbackAudio(false);
        new Audio(url).play();
      } else {
        // Live TTS flaked — play the pre-recorded fallback for this type
        // (public/fallback-audio/*.mp3) so the demo still speaks.
        const t = (data.parsed && data.parsed.type) || 'food';
        const url = `/fallback-audio/${t}.mp3`;
        setAudioUrl(url);
        setFallbackAudio(true);
        new Audio(url).play().catch(() => {});
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setAnswer('That took too long — the voice service is slow right now. Please try again.');
      } else {
        // Don't fail silently: show what happened so it's diagnosable.
        setAnswer(`Couldn't reach the server (${err?.message || 'fetch failed'}). Is the dev server still running? Restart it with npm run dev and try again.`);
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 36 }}>🎙️ VoiceBridge SD</h1>
      <p>Speak or type what you need. We’ll find free food, shelter, or a clinic near you — and read it out loud.</p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', padding: 16, fontSize: 18, borderRadius: 12, border: '2px solid #111' }}
      />
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button onClick={ask} disabled={loading} style={{ flex: 1, padding: 16, fontSize: 18, borderRadius: 12, background: '#111', color: '#fff', cursor: 'pointer' }}>
          {loading ? 'Finding help…' : '🔊 Ask out loud'}
        </button>
        {micSupported && (
          <button onClick={listening ? stopListening : listen} style={{ padding: 16, borderRadius: 12, background: listening ? '#b91c1c' : undefined, color: listening ? '#fff' : undefined, animation: listening ? 'pulse 1.2s ease-in-out infinite' : undefined }}>
            {listening ? '■ Stop' : '🎤 Speak'}
          </button>
        )}
        <button onClick={() => setQuery('I need a shelter in Downtown tonight')} style={{ padding: 16, borderRadius: 12 }}>Shelter</button>
        <button onClick={() => setQuery('I need a free clinic near City Heights')} style={{ padding: 16, borderRadius: 12 }}>Clinic</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {['La Jolla', 'Downtown', 'City Heights'].map((area) => (
          <button key={area} onClick={() => setQuery(`I need free food near ${area} today`)} style={{ padding: '8px 12px', borderRadius: 20, border: '1px solid #999', background: '#fff', cursor: 'pointer' }}>
            📍 {area}
          </button>
        ))}
      </div>
      {micStatus && <p style={{ fontSize: 14, color: '#333', marginTop: 8 }}>{micStatus}</p>}
      {!micSupported && <p style={{ fontSize: 13, color: '#666' }}>Tip: use Chrome or Edge for the Speak button — other browsers hide it and typing still works.</p>}

      {answer && (
        <div style={{ marginTop: 24, padding: 20, background: '#f0f7ff', borderRadius: 12, animation: 'fadeUp .4s ease' }}>
          <h2>Answer</h2>
          <p style={{ fontSize: 18, lineHeight: 1.5 }}>{answer}</p>
          {fallbackAudio && <p style={{ fontSize: 13, color: '#666' }}>Playing a pre-recorded answer — live voice is unavailable right now.</p>}
          {audioUrl && <audio controls src={audioUrl} style={{ width: '100%' }} />}
        </div>
      )}

      {resources.map((r: any) => (
        <div key={r.id} style={{ marginTop: 12, padding: 16, border: '1px solid #ddd', borderRadius: 12, animation: 'fadeUp .4s ease' }}>
          <strong>{r.name}</strong> — {r.type}
          <br />{r.address}
          <br />Hours: {r.hours} • Phone: {r.phone ? <a href={`tel:${r.phone.replace(/[^0-9]/g, '')}`}>{r.phone}</a> : 'not listed'}
          {r.website && (<><br /><a href={r.website} target="_blank" rel="noreferrer">Visit website ↗</a></>)}
          <br /><small>Last updated: {r.last_scraped ? new Date(r.last_scraped).toLocaleString() : 'seed data'}</small>
        </div>
      ))}

      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } } @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(185,28,28,.5); } 50% { box-shadow: 0 0 0 8px rgba(185,28,28,0); } }`}</style>
      <footer style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #ddd', fontSize: 13, color: '#666' }}>
        <p>How it works: Bright Data scrapes live listings → Neon stores them → Gemini understands + summarizes → ElevenLabs speaks the answer.</p>
        {stats && <p>📊 {stats.count} resources in the database{stats.updated ? ` · last updated ${new Date(stats.updated).toLocaleString()}` : ''}.</p>}
        <p>Free help in San Diego County — or dial 211 any time.</p>
      </footer>
    </main>
  );
}
