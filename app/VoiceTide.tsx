'use client';

import { useEffect, useRef } from 'react';

type Mode = 'idle' | 'listening' | 'loading' | 'speaking';

type Props = {
  mode: Mode;
  onFill?: (kind: 'food' | 'shelter' | 'clinic') => void;
};

type Buoy = {
  kind: 'food' | 'shelter' | 'clinic';
  label: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  r: number;
  color: string;
  phase: number;
};

/**
 * Interactive coastal “voice tide” — decorative art that also fills examples
 * when a buoy is activated (true affordance, not a dead control).
 */
export default function VoiceTide({ mode, onFill }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<Mode>(mode);
  const onFillRef = useRef(onFill);
  const pointer = useRef({ x: 0.55, y: 0.4, active: false, down: false });
  const drag = useRef<{ kind: Buoy['kind']; ox: number; oy: number } | null>(null);

  modeRef.current = mode;
  onFillRef.current = onFill;

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const wrapEl = wrapRef.current;
    if (!canvasEl || !wrapEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const wrap: HTMLDivElement = wrapEl;
    const ctxMaybe = canvas.getContext('2d');
    if (!ctxMaybe) return;
    const ctx: CanvasRenderingContext2D = ctxMaybe;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const buoys: Buoy[] = [
      { kind: 'food', label: 'Food', x: 0, y: 0, homeX: 0, homeY: 0, r: 22, color: '#b45309', phase: 0.2 },
      { kind: 'shelter', label: 'Shelter', x: 0, y: 0, homeX: 0, homeY: 0, r: 22, color: '#1a5f7a', phase: 1.1 },
      { kind: 'clinic', label: 'Clinic', x: 0, y: 0, homeX: 0, homeY: 0, r: 22, color: '#2d6a4f', phase: 2.0 },
    ];

    function layoutBuoys() {
      const baseY = h * 0.62;
      const xs = [0.22, 0.5, 0.78];
      buoys.forEach((b, i) => {
        b.homeX = xs[i] * w;
        b.homeY = baseY;
        if (!drag.current || drag.current.kind !== b.kind) {
          b.x = b.homeX;
          b.y = b.homeY;
        }
      });
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      w = Math.max(320, Math.floor(rect.width));
      h = Math.max(180, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layoutBuoys();
    }

    function hitTest(px: number, py: number): Buoy | null {
      for (let i = buoys.length - 1; i >= 0; i--) {
        const b = buoys[i];
        const dx = px - b.x;
        const dy = py - b.y;
        if (dx * dx + dy * dy <= (b.r + 10) * (b.r + 10)) return b;
      }
      return null;
    }

    function localPos(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onPointerMove(e: PointerEvent) {
      const p = localPos(e);
      pointer.current.x = p.x / w;
      pointer.current.y = p.y / h;
      pointer.current.active = true;
      if (drag.current) {
        const b = buoys.find((x) => x.kind === drag.current!.kind);
        if (b) {
          b.x = Math.max(b.r, Math.min(w - b.r, p.x - drag.current.ox));
          b.y = Math.max(b.r, Math.min(h - b.r, p.y - drag.current.oy));
        }
      }
      canvas.style.cursor = hitTest(p.x, p.y) || drag.current ? 'grab' : 'crosshair';
    }

    function onPointerDown(e: PointerEvent) {
      const p = localPos(e);
      const hit = hitTest(p.x, p.y);
      pointer.current.down = true;
      if (hit) {
        drag.current = { kind: hit.kind, ox: p.x - hit.x, oy: p.y - hit.y };
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
      }
    }

    function onPointerUp(e: PointerEvent) {
      const p = localPos(e);
      const was = drag.current;
      drag.current = null;
      pointer.current.down = false;
      if (was) {
        const b = buoys.find((x) => x.kind === was.kind);
        if (b) {
          const moved = Math.hypot(b.x - b.homeX, b.y - b.homeY);
          // Tap (little move) fills example; drag is just play.
          if (moved < 14) onFillRef.current?.(b.kind);
        }
        canvas.style.cursor = hitTest(p.x, p.y) ? 'grab' : 'crosshair';
      }
    }

    function onPointerLeave() {
      pointer.current.active = false;
      drag.current = null;
    }

    function waveY(x: number, t: number, amp: number, freq: number, speed: number, phase: number) {
      const px = pointer.current.x * w;
      const pull = Math.exp(-((x - px) ** 2) / (2 * (90 + amp * 40) ** 2));
      const pointerBoost = pointer.current.active ? 1 + pull * 1.4 : 1;
      return Math.sin(x * freq + t * speed + phase) * amp * pointerBoost;
    }

    function drawBridge(t: number) {
      const m = modeRef.current;
      const energy = m === 'speaking' ? 1.25 : m === 'listening' ? 1.15 : m === 'loading' ? 1.1 : 1;
      const y0 = h * 0.48;
      const left = w * 0.08;
      const right = w * 0.92;
      const mid = (left + right) / 2;
      const arch = h * 0.22 * energy;

      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(14, 77, 104, 0.55)';
      ctx.beginPath();
      ctx.moveTo(left, y0 + 18);
      ctx.quadraticCurveTo(mid, y0 - arch, right, y0 + 18);
      ctx.stroke();

      // Suspender cables
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = 'rgba(26, 95, 122, 0.35)';
      for (let i = 1; i <= 7; i++) {
        const x = left + ((right - left) * i) / 8;
        const top = y0 - arch * Math.sin((Math.PI * i) / 8) + Math.sin(t * 2 + i) * (m === 'speaking' ? 2.5 : 1);
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, y0 + 22 + waveY(x, t, 4, 0.02, 1.5, 0) * 0.2);
        ctx.stroke();
      }

      // Voice pulse traveling across the bridge
      const pulseX = left + ((Math.sin(t * (m === 'listening' ? 2.2 : 1.4)) + 1) / 2) * (right - left);
      const pulseY = y0 - arch * Math.sin((Math.PI * (pulseX - left)) / (right - left));
      const pulseColor = m === 'listening' ? '#b42318' : m === 'speaking' ? '#0e4d68' : m === 'loading' ? '#b45309' : '#1a5f7a';
      const grd = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 28);
      grd.addColorStop(0, pulseColor);
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawTide(t: number) {
      const m = modeRef.current;
      const layers = [
        { amp: 10, freq: 0.018, speed: 1.2, phase: 0, alpha: 0.18, y: h * 0.72, color: '#7eb8c9' },
        { amp: 14, freq: 0.014, speed: 0.9, phase: 1.3, alpha: 0.22, y: h * 0.78, color: '#4f93a8' },
        { amp: 18, freq: 0.011, speed: 0.7, phase: 2.1, alpha: 0.28, y: h * 0.86, color: '#1a5f7a' },
      ];
      if (m === 'speaking') layers.forEach((l) => { l.amp *= 1.35; l.speed *= 1.25; });
      if (m === 'listening') layers.forEach((l) => { l.amp *= 1.2; l.color = '#c45c5c'; });
      if (m === 'loading') layers.forEach((l) => { l.speed *= 1.6; });

      for (const layer of layers) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 6) {
          const y = layer.y + waveY(x, t, layer.amp, layer.freq, layer.speed, layer.phase);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = hexAlpha(layer.color, layer.alpha);
        ctx.fill();
      }
    }

    function drawRipples(t: number) {
      const m = modeRef.current;
      if (m !== 'listening' && m !== 'speaking') return;
      const cx = pointer.current.active ? pointer.current.x * w : w * 0.5;
      const cy = pointer.current.active ? pointer.current.y * h : h * 0.42;
      const color = m === 'listening' ? '180, 35, 24' : '14, 77, 104';
      for (let i = 0; i < 3; i++) {
        const r = 20 + ((t * 40 + i * 28) % 90);
        const a = Math.max(0, 0.35 - r / 260);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color},${a})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    function drawBuoys(t: number) {
      for (const b of buoys) {
        const bob = reduceMotion ? 0 : Math.sin(t * 1.6 + b.phase) * 5;
        const dragging = drag.current?.kind === b.kind;
        if (!dragging) {
          b.x += (b.homeX - b.x) * 0.06;
          b.y += (b.homeY + bob - b.y) * 0.06;
        }
        // Pointer magnetism
        if (pointer.current.active && !dragging) {
          const px = pointer.current.x * w;
          const py = pointer.current.y * h;
          const dx = px - b.x;
          const dy = py - b.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 120) {
            b.x -= (dx / dist) * 0.8;
            b.y -= (dy / dist) * 0.8;
          }
        }

        ctx.save();
        ctx.shadowColor = hexAlpha(b.color, 0.35);
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = b.color;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(b.x, b.y - 2, b.r * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();

        ctx.fillStyle = '#14232b';
        ctx.font = `600 12px Lexend, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(b.label, b.x, b.y + b.r + 16);
        ctx.restore();
      }
    }

    function drawHint(t: number) {
      const a = 0.45 + Math.sin(t * 2) * 0.12;
      ctx.fillStyle = `rgba(74, 93, 104, ${a})`;
      ctx.font = `500 12px Lexend, system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('Drag the tide · tap a buoy to fill an example', 14, 22);
    }

    function frame(now: number) {
      const t = reduceMotion ? 0 : now / 1000;
      ctx.clearRect(0, 0, w, h);

      // Sky wash
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, 'rgba(207, 234, 243, 0.9)');
      sky.addColorStop(0.55, 'rgba(238, 247, 248, 0.35)');
      sky.addColorStop(1, 'rgba(232, 243, 240, 0.15)');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Soft sun / listening flare
      const m = modeRef.current;
      const sx = w * (0.78 + (pointer.current.x - 0.5) * 0.08);
      const sy = h * 0.22;
      const sun = ctx.createRadialGradient(sx, sy, 4, sx, sy, 70);
      sun.addColorStop(0, m === 'listening' ? 'rgba(180,35,24,0.35)' : 'rgba(255, 214, 150, 0.55)');
      sun.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(sx, sy, 70, 0, Math.PI * 2);
      ctx.fill();

      drawBridge(t);
      drawRipples(t);
      drawTide(t);
      drawBuoys(t);
      drawHint(t);

      raf = requestAnimationFrame(frame);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('pointercancel', onPointerLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointercancel', onPointerLeave);
    };
  }, []);

  return (
    <div className="vb-tide" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className={`vb-tide-canvas is-${mode}`}
        role="img"
        aria-label="Interactive voice tide art. Drag to play with the water. Tap Food, Shelter, or Clinic buoys to fill an example in the text box."
      />
    </div>
  );
}

function hexAlpha(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
