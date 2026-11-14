'use client';
import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('I need free food near La Jolla today');
  const [answer, setAnswer] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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
        new Audio(url).play();
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setAnswer('That took too long — the voice service is slow right now. Please try again.');
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
        <button onClick={() => setQuery('I need a shelter in Downtown tonight')} style={{ padding: 16, borderRadius: 12 }}>Shelter</button>
        <button onClick={() => setQuery('I need a free clinic near City Heights')} style={{ padding: 16, borderRadius: 12 }}>Clinic</button>
      </div>

      {answer && (
        <div style={{ marginTop: 24, padding: 20, background: '#f0f7ff', borderRadius: 12 }}>
          <h2>Answer</h2>
          <p style={{ fontSize: 18, lineHeight: 1.5 }}>{answer}</p>
          {audioUrl && <audio controls src={audioUrl} style={{ width: '100%' }} />}
        </div>
      )}

      {resources.map((r: any) => (
        <div key={r.id} style={{ marginTop: 12, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
          <strong>{r.name}</strong> — {r.type}
          <br />{r.address}
          <br />Hours: {r.hours} • Phone: {r.phone}
          <br /><small>Last updated: {r.last_scraped ? new Date(r.last_scraped).toLocaleString() : 'seed data'}</small>
        </div>
      ))}
    </main>
  );
}
