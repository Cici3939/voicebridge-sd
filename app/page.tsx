'use client';
import { useState, useEffect, useRef } from 'react';

type Resource = {
  id: string | number;
  name: string;
  type: string;
  address?: string;
  hours?: string;
  phone?: string;
  website?: string;
  last_scraped?: string;
};

const TYPE_META: Record<string, { label: string; accent: string; soft: string; icon: string }> = {
  food: { label: 'Food', accent: '#b45309', soft: '#fff8eb', icon: '🍲' },
  shelter: { label: 'Shelter', accent: '#1a5f7a', soft: '#e8f4f8', icon: '🏠' },
  clinic: { label: 'Clinic', accent: '#2d6a4f', soft: '#eaf6ef', icon: '✚' },
};

function typeMeta(type?: string) {
  const key = (type || '').toLowerCase();
  return TYPE_META[key] || { label: type || 'Help', accent: '#1a5f7a', soft: '#eef6f9', icon: '◎' };
}

export default function Home() {
  const [query, setQuery] = useState('I need free food near La Jolla today');
  const [answer, setAnswer] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
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
        const updated = rows.map((r: Resource) => r.last_scraped).filter(Boolean).sort().pop() || null;
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
        setMicStatus(finalText ? 'Heard you — tap “Ask out loud” to get the answer.' : 'Listening… keep talking.');
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
        setMicStatus(`Mic error (${code}) — tap Speak again, or just type and tap “Ask out loud”.`);
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
    setMicStatus((s) => (s && s.startsWith('Heard you') ? s : 'Stopped listening — tap “Ask out loud” to get the answer.'));
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
    <main className="vb">
      <header className="vb-mission" aria-labelledby="vb-brand">
        <p className="vb-eyebrow">San Diego · free help · voice-first</p>
        <h1 id="vb-brand" className="vb-brand">VoiceBridge SD</h1>
        <p className="vb-mission-line">
          Speak or type what you need. We find free food, shelter, or a clinic near you — and read the answer out loud.
        </p>
        <ul className="vb-mission-pills" aria-label="What we help with">
          <li><span className="dot food" aria-hidden /> Food</li>
          <li><span className="dot shelter" aria-hidden /> Shelter</li>
          <li><span className="dot clinic" aria-hidden /> Clinic</li>
        </ul>
      </header>

      <section className="vb-ask" aria-label="Ask for help">
        <label className="vb-label" htmlFor="need-input">What do you need?</label>
        <div className={`vb-input-wrap${listening ? ' is-listening' : ''}`}>
          <textarea
            id="need-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={2}
            placeholder="e.g. I need free food near La Jolla today"
            aria-describedby={micStatus ? 'mic-status' : undefined}
          />
          {listening && <span className="vb-live-badge" aria-live="polite">Listening</span>}
        </div>

        <div className="vb-actions">
          <button
            type="button"
            className="vb-btn vb-btn-primary"
            onClick={ask}
            disabled={loading || !query.trim()}
            aria-busy={loading}
          >
            <span className="vb-btn-icon" aria-hidden>{loading ? '…' : '🔊'}</span>
            {loading ? 'Finding help…' : 'Ask out loud'}
          </button>
          {micSupported ? (
            <button
              type="button"
              className={`vb-btn vb-btn-mic${listening ? ' is-on' : ''}`}
              onClick={listening ? stopListening : listen}
              aria-pressed={listening}
              title={listening ? 'Stop listening' : 'Speak your need into the mic'}
            >
              <span className="vb-btn-icon" aria-hidden>{listening ? '■' : '🎤'}</span>
              {listening ? 'Stop' : 'Speak'}
            </button>
          ) : null}
        </div>

        {micStatus && (
          <p id="mic-status" className="vb-status" role="status">{micStatus}</p>
        )}
        {!micSupported && (
          <p className="vb-hint">Tip: use Chrome or Edge for Speak — typing still works everywhere.</p>
        )}

        <div className="vb-shortcuts">
          <p className="vb-label-sm">Try a need</p>
          <div className="vb-chip-row" role="group" aria-label="Quick need examples">
            <button
              type="button"
              className="vb-chip food"
              onClick={() => setQuery('I need free food near La Jolla today')}
              title="Fill: free food near La Jolla"
            >
              <span aria-hidden>🍲</span> Food
            </button>
            <button
              type="button"
              className="vb-chip shelter"
              onClick={() => setQuery('I need a shelter in Downtown tonight')}
              title="Fill: shelter in Downtown"
            >
              <span aria-hidden>🏠</span> Shelter
            </button>
            <button
              type="button"
              className="vb-chip clinic"
              onClick={() => setQuery('I need a free clinic near City Heights')}
              title="Fill: free clinic near City Heights"
            >
              <span aria-hidden>✚</span> Clinic
            </button>
          </div>
          <p className="vb-label-sm">Near</p>
          <div className="vb-chip-row" role="group" aria-label="Quick area examples">
            {['La Jolla', 'Downtown', 'City Heights'].map((area) => (
              <button
                key={area}
                type="button"
                className="vb-chip area"
                onClick={() => setQuery(`I need free food near ${area} today`)}
                title={`Fill: free food near ${area}`}
              >
                <span aria-hidden>📍</span> {area}
              </button>
            ))}
          </div>
        </div>
      </section>

      {answer && (
        <section className="vb-answer" aria-live="polite" aria-label="Spoken answer">
          <div className="vb-answer-head">
            <h2>Your spoken answer</h2>
            {audioUrl && <span className="vb-playing-tag">Audio ready</span>}
          </div>
          <p className="vb-answer-text">{answer}</p>
          {fallbackAudio && (
            <p className="vb-hint">Playing a pre-recorded answer — live voice is unavailable right now.</p>
          )}
          {audioUrl && (
            <div className="vb-audio">
              <label className="vb-label-sm" htmlFor="answer-audio">Replay aloud</label>
              <audio id="answer-audio" controls src={audioUrl} />
            </div>
          )}
        </section>
      )}

      {resources.length > 0 && (
        <section className="vb-results" aria-label="Matching resources">
          <h2 className="vb-results-title">{resources.length} place{resources.length === 1 ? '' : 's'} nearby</h2>
          <ul className="vb-cards">
            {resources.map((r) => {
              const meta = typeMeta(r.type);
              const tel = r.phone ? r.phone.replace(/[^0-9+]/g, '') : '';
              return (
                <li
                  key={r.id}
                  className="vb-card"
                  style={{ borderColor: meta.accent, background: meta.soft }}
                >
                  <div className="vb-card-top">
                    <span className="vb-type-badge" style={{ background: meta.accent }}>
                      <span aria-hidden>{meta.icon}</span> {meta.label}
                    </span>
                    <small className="vb-updated">
                      {r.last_scraped ? `Updated ${new Date(r.last_scraped).toLocaleString()}` : 'Seed data'}
                    </small>
                  </div>
                  <h3 className="vb-card-name">{r.name}</h3>
                  {r.address && <p className="vb-card-meta">{r.address}</p>}
                  {r.hours && <p className="vb-card-meta"><strong>Hours</strong> · {r.hours}</p>}
                  <div className="vb-card-actions">
                    {r.phone ? (
                      <a className="vb-link-btn call" href={`tel:${tel}`} title={`Call ${r.phone}`}>
                        <span aria-hidden>📞</span> Call {r.phone}
                      </a>
                    ) : (
                      <span className="vb-link-btn disabled" title="No phone listed">Phone not listed</span>
                    )}
                    {r.website && (
                      <a
                        className="vb-link-btn site"
                        href={r.website}
                        target="_blank"
                        rel="noreferrer"
                        title="Open website in a new tab"
                      >
                        Visit website ↗
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="vb-footer">
        <p>How it works: Bright Data scrapes live listings → Neon stores them → Gemini understands + summarizes → ElevenLabs speaks the answer.</p>
        {stats && (
          <p>
            {stats.count} resources in the database
            {stats.updated ? ` · last updated ${new Date(stats.updated).toLocaleString()}` : ''}.
          </p>
        )}
        <p>
          Free help in San Diego County — or dial{' '}
          <a className="vb-emergency" href="tel:211" title="Call 211 for free local help">211</a>
          {' '}any time.
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Lexend:wght@400;500;600;700&display=swap');

        .vb {
          --ocean: #0e4d68;
          --sky: #e7f3f7;
          --mist: #eef7f8;
          --ink: #14232b;
          --muted: #4a5d68;
          --food: #b45309;
          --shelter: #1a5f7a;
          --clinic: #2d6a4f;
          --line: rgba(20, 35, 43, 0.12);
          --radius: 18px;
          max-width: 760px;
          margin: 0 auto;
          padding: 28px 20px 56px;
          font-family: 'Lexend', system-ui, sans-serif;
          color: var(--ink);
          background:
            radial-gradient(1100px 520px at 8% -8%, #cfeaf3 0%, transparent 58%),
            radial-gradient(800px 400px at 100% 5%, #d9f0e6 0%, transparent 52%),
            linear-gradient(180deg, #f3fafb 0%, var(--mist) 45%, #e8f3f0 100%);
          min-height: 100vh;
          box-sizing: border-box;
          animation: vbFade 0.5s ease;
        }
        .vb *, .vb *::before, .vb *::after { box-sizing: border-box; }

        .vb-mission {
          margin-bottom: 28px;
          padding-bottom: 22px;
          border-bottom: 1px solid var(--line);
          animation: vbRise 0.55s ease;
        }
        .vb-eyebrow {
          margin: 0 0 8px;
          font-size: 0.95rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--shelter);
          font-weight: 600;
        }
        .vb-brand {
          margin: 0 0 12px;
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(2.6rem, 7vw, 3.6rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: var(--ocean);
        }
        .vb-mission-line {
          margin: 0 0 16px;
          font-size: clamp(1.15rem, 2.6vw, 1.35rem);
          line-height: 1.45;
          color: var(--muted);
          max-width: 38ch;
        }
        .vb-mission-pills {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 10px 16px;
          margin: 0;
          padding: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--ink);
        }
        .vb-mission-pills .dot {
          display: inline-block;
          width: 0.65rem;
          height: 0.65rem;
          border-radius: 50%;
          margin-right: 0.4rem;
          vertical-align: 0.05em;
        }
        .dot.food { background: var(--food); }
        .dot.shelter { background: var(--shelter); }
        .dot.clinic { background: var(--clinic); }

        .vb-ask { animation: vbRise 0.65s ease; }
        .vb-label {
          display: block;
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .vb-label-sm {
          display: block;
          margin: 16px 0 8px;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .vb-input-wrap {
          position: relative;
          border: 2px solid var(--ocean);
          border-radius: var(--radius);
          background: #fff;
          box-shadow: 0 10px 28px rgba(14, 77, 104, 0.08);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .vb-input-wrap.is-listening {
          border-color: #b42318;
          box-shadow: 0 0 0 4px rgba(180, 35, 24, 0.15);
        }
        .vb-input-wrap textarea {
          width: 100%;
          border: 0;
          outline: none;
          resize: vertical;
          min-height: 88px;
          padding: 18px 18px 18px;
          font: inherit;
          font-size: 1.25rem;
          line-height: 1.4;
          background: transparent;
          color: var(--ink);
        }
        .vb-live-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #b42318;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          animation: vbPulse 1.2s ease-in-out infinite;
        }

        .vb-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 14px;
        }
        .vb-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 56px;
          padding: 14px 22px;
          border-radius: 14px;
          border: 2px solid transparent;
          font: inherit;
          font-size: 1.15rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s;
        }
        .vb-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .vb-btn:active:not(:disabled) { transform: translateY(0); }
        .vb-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .vb-btn-icon { font-size: 1.2rem; line-height: 1; }
        .vb-btn-primary {
          flex: 1 1 220px;
          background: var(--ocean);
          color: #fff;
          box-shadow: 0 8px 20px rgba(14, 77, 104, 0.25);
        }
        .vb-btn-primary:hover:not(:disabled) {
          background: #0a3d53;
        }
        .vb-btn-mic {
          flex: 0 0 auto;
          background: #fff;
          border-color: var(--ocean);
          color: var(--ocean);
        }
        .vb-btn-mic.is-on {
          background: #b42318;
          border-color: #b42318;
          color: #fff;
          animation: vbPulse 1.2s ease-in-out infinite;
        }

        .vb-status {
          margin: 12px 0 0;
          padding: 12px 14px;
          border-radius: 12px;
          background: #fff7ed;
          border-left: 4px solid var(--food);
          font-size: 1rem;
          line-height: 1.4;
          color: var(--ink);
        }
        .vb-hint {
          margin: 10px 0 0;
          font-size: 0.95rem;
          color: var(--muted);
        }

        .vb-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .vb-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1.5px solid var(--line);
          background: #fff;
          font: inherit;
          font-size: 1rem;
          font-weight: 500;
          color: var(--ink);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
        }
        .vb-chip:hover { transform: translateY(-1px); }
        .vb-chip.food { border-color: color-mix(in srgb, var(--food) 45%, white); color: var(--food); }
        .vb-chip.food:hover { background: #fff8eb; border-color: var(--food); }
        .vb-chip.shelter { border-color: color-mix(in srgb, var(--shelter) 45%, white); color: var(--shelter); }
        .vb-chip.shelter:hover { background: #e8f4f8; border-color: var(--shelter); }
        .vb-chip.clinic { border-color: color-mix(in srgb, var(--clinic) 45%, white); color: var(--clinic); }
        .vb-chip.clinic:hover { background: #eaf6ef; border-color: var(--clinic); }
        .vb-chip.area:hover { background: var(--sky); border-color: var(--shelter); color: var(--shelter); }

        .vb-answer {
          margin-top: 28px;
          padding: 22px;
          border-radius: var(--radius);
          background: linear-gradient(160deg, #e8f4f8 0%, #fff 70%);
          border: 1px solid color-mix(in srgb, var(--shelter) 25%, white);
          box-shadow: 0 12px 30px rgba(26, 95, 122, 0.08);
          animation: vbRise 0.45s ease;
        }
        .vb-answer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }
        .vb-answer-head h2 {
          margin: 0;
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.55rem;
          color: var(--ocean);
        }
        .vb-playing-tag {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--clinic);
          background: #eaf6ef;
          padding: 6px 10px;
          border-radius: 999px;
        }
        .vb-answer-text {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.55;
        }
        .vb-audio {
          margin-top: 14px;
        }
        .vb-audio audio {
          width: 100%;
          margin-top: 4px;
        }

        .vb-results { margin-top: 28px; animation: vbRise 0.5s ease; }
        .vb-results-title {
          margin: 0 0 14px;
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.55rem;
          color: var(--ocean);
        }
        .vb-cards {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 14px;
        }
        .vb-card {
          padding: 18px 18px 16px;
          border-radius: var(--radius);
          border: 2px solid;
          border-left-width: 6px;
          box-shadow: 0 8px 22px rgba(20, 35, 43, 0.05);
        }
        .vb-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .vb-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 999px;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .vb-updated {
          color: var(--muted);
          font-size: 0.8rem;
        }
        .vb-card-name {
          margin: 0 0 6px;
          font-size: 1.35rem;
          line-height: 1.25;
          font-weight: 700;
        }
        .vb-card-meta {
          margin: 0 0 4px;
          font-size: 1.05rem;
          line-height: 1.4;
          color: var(--muted);
        }
        .vb-card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }
        .vb-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 14px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          border: 1.5px solid transparent;
          transition: transform 0.15s, background 0.15s;
        }
        .vb-link-btn:hover { transform: translateY(-1px); }
        .vb-link-btn.call {
          background: var(--ocean);
          color: #fff;
        }
        .vb-link-btn.site {
          background: #fff;
          color: var(--shelter);
          border-color: color-mix(in srgb, var(--shelter) 35%, white);
        }
        .vb-link-btn.disabled {
          background: rgba(20, 35, 43, 0.06);
          color: var(--muted);
          cursor: default;
        }

        .vb-footer {
          margin-top: 40px;
          padding-top: 18px;
          border-top: 1px solid var(--line);
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .vb-footer p { margin: 0 0 8px; }
        .vb-emergency {
          color: var(--ocean);
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        @keyframes vbFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes vbRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes vbPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(180, 35, 24, 0.45); }
          50% { box-shadow: 0 0 0 10px rgba(180, 35, 24, 0); }
        }

        @media (max-width: 560px) {
          .vb { padding: 20px 16px 40px; }
          .vb-btn { width: 100%; }
          .vb-btn-mic { width: 100%; }
          .vb-card-top { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </main>
  );
}
