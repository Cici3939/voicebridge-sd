'use client';
import { useState, useEffect, useRef } from 'react';
import VoiceTide from './VoiceTide';

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
  const [micLang, setMicLang] = useState<'en' | 'es'>('en');
  const [stats, setStats] = useState<{ count: number; updated: string | null } | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const recRef = useRef<any>(null);
  const wantListeningRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setMicSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    return () => {
      wantListeningRef.current = false;
      try { recRef.current?.abort?.(); } catch { /* ignore */ }
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
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

  function stopAnswerAudio() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setAudioPlaying(false);
  }

  // Autoplay through the same <audio controls> element after React mounts/updates it.
  useEffect(() => {
    if (!audioUrl) return;
    const el = audioRef.current;
    if (!el) return;
    el.src = audioUrl;
    const playPromise = el.play();
    if (playPromise) playPromise.catch(() => setAudioPlaying(false));
  }, [audioUrl]);

  function stopListening(reason: 'user' | 'answer' | 'quiet' = 'user') {
    wantListeningRef.current = false;
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      try { rec.onresult = null; rec.onend = null; rec.onerror = null; } catch { /* ignore */ }
      try { rec.abort(); } catch {
        try { rec.stop(); } catch { /* already stopped */ }
      }
    }
    setListening(false);
    if (reason === 'quiet') return;
    if (reason === 'answer') {
      setMicStatus('Mic off — finding your spoken answer…');
      return;
    }
    setMicStatus((s) => (s && s.startsWith('Heard you') ? s : 'Stopped listening — tap “Answer out loud” for the spoken reply.'));
  }

  // Browser speech-to-text (Web Speech API, Chrome/Edge). Fills the input
  // with what the user said — they still tap "Answer out loud" to get the
  // spoken answer, so a mic failure can never break the demo.
  function listen() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMicStatus('Speech recognition isn’t available here — type your need, then tap “Answer out loud”.');
      return;
    }

    // Tear down any prior session so a stuck recognizer can’t block Speak.
    stopListening('quiet');
    stopAnswerAudio();

    const rec = new SR();
    recRef.current = rec;
    // Mic language matters: an English recognizer mangles Spanish speech
    // into gibberish, which the parser then defaults to food. The EN/ES
    // toggle next to Speak picks which language the mic listens in.
    rec.lang = micLang === 'es' ? 'es-US' : 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      let finalText = '';
      let interimText = '';
      // Rebuild from the full result list so pauses don’t wipe earlier words.
      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      const heard = (finalText || interimText).trim();
      if (heard) {
        setQuery(heard);
        setMicStatus(finalText
          ? 'Heard you — tap “Answer out loud” for the spoken reply.'
          : 'Listening… keep talking.');
      }
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      // Chrome ends a session after a pause even in continuous mode —
      // restart while the user still wants to talk.
      if (wantListeningRef.current) {
        try { rec.start(); return; } catch {
          setTimeout(() => {
            if (wantListeningRef.current && recRef.current === rec) {
              try { rec.start(); } catch {
                wantListeningRef.current = false;
                setListening(false);
                setMicStatus('Mic paused — tap Speak to start again.');
              }
            }
          }, 200);
          return;
        }
      }
      setListening(false);
    };
    rec.onerror = (e: any) => {
      if (recRef.current !== rec) return;
      const code = e?.error || 'unknown';
      if (code === 'aborted') return; // stopListening / Answer out loud
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
      } else {
        wantListeningRef.current = false;
        setListening(false);
        setMicStatus(`Mic error (${code}) — tap Speak again, or type and tap “Answer out loud”.`);
      }
    };

    wantListeningRef.current = true;
    setListening(true);
    setMicStatus('Listening… speak now — tap Stop when you’re done.');
    try {
      rec.start();
    } catch {
      // start() throws if a previous session is still winding down.
      setTimeout(() => {
        if (!wantListeningRef.current || recRef.current !== rec) return;
        try {
          rec.start();
        } catch {
          wantListeningRef.current = false;
          setListening(false);
          setMicStatus('Couldn’t start the mic — tap Speak again.');
        }
      }, 280);
    }
  }

  async function ask() {
    stopListening('answer');
    stopAnswerAudio();
    setLoading(true);
    setAnswer('');
    setResources([]);
    setAudioUrl(null);
    setFallbackAudio(false);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

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
        blobUrlRef.current = url;
        setAudioUrl(url);
        setFallbackAudio(false);
      } else {
        // Live TTS flaked — play the pre-recorded fallback for this type
        // (public/fallback-audio/*.mp3) so the demo still speaks.
        const t = (data.parsed && data.parsed.type) || 'food';
        const url = `/fallback-audio/${t}.mp3`;
        setAudioUrl(url);
        setFallbackAudio(true);
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

  const artMode = listening ? 'listening' : loading ? 'loading' : audioPlaying ? 'speaking' : 'idle';

  function fillExample(kind: 'food' | 'shelter' | 'clinic') {
    if (kind === 'food') setQuery('I need free food near La Jolla today');
    else if (kind === 'shelter') setQuery('I need a shelter in Downtown tonight');
    else setQuery('I need a free clinic near City Heights');
    setMicStatus('Filled an example from the tide — tap “Answer out loud” for the spoken reply.');
  }

  return (
    <main className={`vb mode-${artMode}`}>
      <div className="vb-aurora" aria-hidden />
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

      <VoiceTide mode={artMode} onFill={fillExample} />

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
            {loading ? 'Finding help…' : 'Answer out loud'}
          </button>
          {micSupported ? (
            <>
              <button
                type="button"
                className={`vb-btn vb-btn-mic${listening ? ' is-on' : ''}`}
                onClick={() => (listening ? stopListening('user') : listen())}
                aria-pressed={listening}
                title={listening ? 'Stop the microphone' : 'Fill the box with your voice'}
              >
                <span className="vb-btn-icon" aria-hidden>{listening ? '■' : '🎤'}</span>
                {listening ? 'Stop mic' : 'Speak'}
              </button>
              <button
                type="button"
                className="vb-chip"
                onClick={() => setMicLang(micLang === 'es' ? 'en' : 'es')}
                aria-pressed={micLang === 'es'}
                title={micLang === 'es' ? 'Mic listens in Spanish — tap for English' : 'Mic listens in English — tap for Spanish'}
              >
                Mic: {micLang === 'es' ? 'Español' : 'English'}
              </button>
            </>
          ) : null}
        </div>

        {micStatus && (
          <p id="mic-status" className="vb-status" role="status">{micStatus}</p>
        )}
        {!micSupported && (
          <p className="vb-hint">Tip: use Chrome or Edge for Speak — typing still works everywhere.</p>
        )}

        <div className="vb-shortcuts">
          <p className="vb-label-sm">Fill examples (does not answer yet)</p>
          <div className="vb-chip-row" role="group" aria-label="Fill the text box with an example need">
            <button
              type="button"
              className="vb-chip food"
              onClick={() => setQuery('I need free food near La Jolla today')}
              title="Only fills the text box — then tap Answer out loud"
            >
              <span aria-hidden>🍲</span> Food example
            </button>
            <button
              type="button"
              className="vb-chip shelter"
              onClick={() => setQuery('I need a shelter in Downtown tonight')}
              title="Only fills the text box — then tap Answer out loud"
            >
              <span aria-hidden>🏠</span> Shelter example
            </button>
            <button
              type="button"
              className="vb-chip clinic"
              onClick={() => setQuery('I need a free clinic near City Heights')}
              title="Only fills the text box — then tap Answer out loud"
            >
              <span aria-hidden>✚</span> Clinic example
            </button>
          </div>
          <p className="vb-label-sm">Fill area into a food example</p>
          <div className="vb-chip-row" role="group" aria-label="Fill the text box with a food need near an area">
            {['La Jolla', 'Downtown', 'City Heights'].map((area) => (
              <button
                key={area}
                type="button"
                className="vb-chip area"
                onClick={() => setQuery(`I need free food near ${area} today`)}
                title={`Only fills the text box with food near ${area}`}
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
            {audioUrl && (
              <span className="vb-playing-tag" aria-live="polite">
                {audioPlaying ? 'Speaking now' : 'Paused — use player to replay'}
              </span>
            )}
          </div>
          <p className="vb-answer-text">{answer}</p>
          {fallbackAudio && (
            <p className="vb-hint">Playing a pre-recorded answer — live voice is unavailable right now.</p>
          )}
          {audioUrl && (
            <div className="vb-audio">
              <label className="vb-label-sm" htmlFor="answer-audio">Same audio (pause / replay)</label>
              <audio
                id="answer-audio"
                ref={audioRef}
                controls
                src={audioUrl}
                onPlay={() => setAudioPlaying(true)}
                onPause={() => setAudioPlaying(false)}
                onEnded={() => setAudioPlaying(false)}
              />
            </div>
          )}
        </section>
      )}

      {resources.length > 0 && (
        <section className="vb-results" aria-label="Matching resources">
          <h2 className="vb-results-title">{resources.length} place{resources.length === 1 ? '' : 's'} nearby</h2>
          <ul className="vb-cards">
            {resources.map((r, i) => {
              const meta = typeMeta(r.type);
              const tel = r.phone ? r.phone.replace(/[^0-9+]/g, '') : '';
              return (
                <li
                  key={r.id}
                  className="vb-card"
                  style={{
                    borderColor: meta.accent,
                    background: meta.soft,
                    animationDelay: `${i * 0.08}s`,
                  }}
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
                      <p className="vb-card-meta">Phone not listed</p>
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
          position: relative;
          overflow-x: clip;
        }
        .vb *, .vb *::before, .vb *::after { box-sizing: border-box; }
        .vb-aurora {
          pointer-events: none;
          position: absolute;
          inset: -10% -20% auto;
          height: 420px;
          background:
            radial-gradient(closest-side, rgba(126, 184, 201, 0.35), transparent 70%),
            radial-gradient(closest-side, rgba(45, 106, 79, 0.18), transparent 70%);
          background-size: 55% 70%, 40% 55%;
          background-position: 10% 40%, 90% 20%;
          background-repeat: no-repeat;
          filter: blur(8px);
          animation: vbAurora 14s ease-in-out infinite alternate;
          z-index: 0;
        }
        .vb.mode-listening .vb-aurora {
          background:
            radial-gradient(closest-side, rgba(180, 35, 24, 0.22), transparent 70%),
            radial-gradient(closest-side, rgba(126, 184, 201, 0.28), transparent 70%);
        }
        .vb.mode-speaking .vb-aurora {
          background:
            radial-gradient(closest-side, rgba(14, 77, 104, 0.28), transparent 70%),
            radial-gradient(closest-side, rgba(45, 106, 79, 0.2), transparent 70%);
        }
        .vb.mode-loading .vb-aurora {
          animation-duration: 4s;
        }
        .vb > *:not(.vb-aurora) { position: relative; z-index: 1; }

        .vb-tide {
          margin: 0 0 22px;
          height: clamp(200px, 32vw, 260px);
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--shelter) 22%, white);
          box-shadow:
            0 18px 40px rgba(14, 77, 104, 0.1),
            inset 0 1px 0 rgba(255,255,255,0.7);
          background: linear-gradient(180deg, #e7f4f8 0%, #f7fbfc 55%, #e8f3f0 100%);
          animation: vbRise 0.7s ease;
          touch-action: none;
        }
        .vb-tide-canvas {
          display: block;
          width: 100%;
          height: 100%;
          cursor: crosshair;
        }
        .vb-tide-canvas.is-listening {
          animation: vbTideGlow 1.4s ease-in-out infinite;
        }
        .vb-tide-canvas.is-speaking {
          animation: vbTideSpeak 2s ease-in-out infinite;
        }

        .vb-mission {
          margin-bottom: 18px;
          padding-bottom: 18px;
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
          background: linear-gradient(120deg, var(--ocean) 0%, #1a5f7a 45%, #2d6a4f 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: vbBrandShimmer 8s ease-in-out infinite;
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
          pointer-events: none; /* legend only — not clickable */
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
          background: linear-gradient(135deg, var(--ocean) 0%, #1a5f7a 55%, #164e63 100%);
          background-size: 160% 160%;
          color: #fff;
          box-shadow: 0 8px 20px rgba(14, 77, 104, 0.25);
          animation: vbBtnDrift 6s ease-in-out infinite;
        }
        .vb-btn-primary:hover:not(:disabled) {
          filter: brightness(1.06);
        }
        .vb.mode-loading .vb-btn-primary {
          animation: vbBtnPulse 1s ease-in-out infinite;
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
          cursor: default;
          pointer-events: none; /* status text, not a control */
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
          animation: vbCardIn 0.55s ease both;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .vb-card:hover {
          transform: translateY(-4px) rotate(-0.2deg);
          box-shadow: 0 16px 32px rgba(20, 35, 43, 0.1);
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
        @keyframes vbAurora {
          from { transform: translate3d(-2%, 0, 0) scale(1); opacity: 0.85; }
          to { transform: translate3d(3%, 4%, 0) scale(1.06); opacity: 1; }
        }
        @keyframes vbBrandShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes vbBtnDrift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes vbBtnPulse {
          0%, 100% { transform: translateY(0); box-shadow: 0 8px 20px rgba(14, 77, 104, 0.25); }
          50% { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(14, 77, 104, 0.4); }
        }
        @keyframes vbCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
        @keyframes vbTideGlow {
          0%, 100% { box-shadow: inset 0 0 0 0 rgba(180, 35, 24, 0.15); }
          50% { box-shadow: inset 0 0 0 3px rgba(180, 35, 24, 0.28); }
        }
        @keyframes vbTideSpeak {
          0%, 100% { filter: saturate(1); }
          50% { filter: saturate(1.15); }
        }

        @media (prefers-reduced-motion: reduce) {
          .vb, .vb-mission, .vb-ask, .vb-answer, .vb-results, .vb-tide,
          .vb-aurora, .vb-brand, .vb-btn-primary, .vb-card,
          .vb-tide-canvas.is-listening, .vb-tide-canvas.is-speaking {
            animation: none !important;
          }
          .vb-card:hover { transform: none; }
        }

        @media (max-width: 560px) {
          .vb { padding: 20px 16px 40px; }
          .vb-btn { width: 100%; }
          .vb-btn-mic { width: 100%; }
          .vb-card-top { flex-direction: column; align-items: flex-start; }
          .vb-tide { height: 210px; }
        }
      `}</style>
    </main>
  );
}
