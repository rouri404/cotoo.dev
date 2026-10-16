// Party light show: a low-resolution pixel canvas behind Tux with beams, a dance floor, equalizers and confetti.
// Started by mascot.js (the "party:start" event); every colour here is a fixed neon on purpose, so none of it depends on the theme.
(function () {
  const BEAT_MS = 476; // 126 bpm, the same beat Tux dances to
  const COLORS = [
    [255, 46, 147],
    [0, 229, 255],
    [255, 230, 0],
    [124, 255, 58],
    [179, 107, 255],
    [255, 122, 0],
  ];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const hash = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  let canvas = null;

  window.addEventListener("party:start", (e) => start((e.detail && e.detail.ms) || 8000));

  function start(duration) {
    if (canvas) return;

    // One canvas pixel is several screen pixels, so everything comes out chunky
    const px = Math.max(3, Math.round(Math.max(window.innerWidth, window.innerHeight) / 420));
    const w = Math.ceil(window.innerWidth / px);
    const h = Math.ceil(window.innerHeight / px);
    canvas = document.createElement("canvas");
    canvas.className = "party-lights";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = w;
    canvas.height = h;
    document.body.appendChild(canvas);
    // Everything else on the page fades out for the show (see mascot.css)
    document.body.classList.add("party-on");
    const ctx = canvas.getContext("2d");

    const tile = 6;
    const floorTop = Math.floor((h * 0.7) / tile) * tile;
    const bits = Array.from({ length: 150 }, () => ({
      x: Math.random() * w,
      y: -Math.random() * h,
      vy: 0.25 + Math.random() * 0.55,
      sway: 1 + Math.random() * 5,
      phase: Math.random() * 6.28,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const t0 = performance.now();
    let last = t0;

    function frame(now) {
      const t = now - t0;
      if (t >= duration) return end();
      requestAnimationFrame(frame);
      const dt = Math.min(50, now - last);
      last = now;

      // Everything fades in and out, so the screen comes back gently
      const fade = Math.min(1, t / 600, (duration - t) / 700);
      const beat = t / BEAT_MS;
      const phase = beat % 1;
      const bi = Math.floor(beat);
      const pulse = 1 - phase;

      const hit = document.querySelector(".mascot-hit");
      const rect = hit && hit.getBoundingClientRect();
      const cx = rect && rect.width ? (rect.left + rect.width / 2) / px : w / 2;
      const cy = rect && rect.width ? (rect.top + rect.height / 2) / px : h / 2;

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 0.95 * fade;
      ctx.fillStyle = "#05030d";
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "lighter";

      // Beams from the ceiling that sweep around Tux
      const beams = 6;
      for (let i = 0; i < beams; i++) {
        const ox = w * (0.08 + (0.84 * i) / (beams - 1));
        const aim = Math.atan2(cy, cx - ox);
        const angle = aim + Math.sin(t / 900 + i * 1.3) * 0.6;
        const spread = 0.07 + 0.03 * Math.sin(t / 500 + i);
        const len = h * 1.5;
        const color = COLORS[(i + bi) % COLORS.length];
        const far = [ox + Math.cos(angle) * len, Math.sin(angle) * len];
        const grad = ctx.createLinearGradient(ox, 0, far[0], far[1]);
        grad.addColorStop(0, rgba(color, (0.5 + 0.2 * pulse) * fade));
        grad.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(ox, 0);
        ctx.lineTo(ox + Math.cos(angle - spread) * len, Math.sin(angle - spread) * len);
        ctx.lineTo(ox + Math.cos(angle + spread) * len, Math.sin(angle + spread) * len);
        ctx.closePath();
        ctx.fill();
      }

      // Dance floor: tiles flash in a checker that flips on every beat
      for (let y = floorTop; y < h; y += tile) {
        for (let x = 0; x < w; x += tile) {
          const gx = x / tile;
          const gy = (y - floorTop) / tile;
          const lit = (gx + gy + bi) % 2 === 0;
          const color = COLORS[Math.floor(hash(gx, gy) * 7 + bi) % COLORS.length];
          ctx.fillStyle = rgba(color, (lit ? 0.12 + 0.4 * pulse : 0.05) * fade);
          ctx.fillRect(x + 1, y + 1, tile - 1, tile - 1);
        }
      }

      // A ring leaves Tux on every beat
      const radius = 6 + phase * 46;
      ctx.fillStyle = rgba(COLORS[bi % COLORS.length], 0.7 * pulse * fade);
      for (let a = 0, steps = Math.ceil(radius * 6); a < steps; a++) {
        const ang = (a / steps) * Math.PI * 2;
        ctx.fillRect(Math.round(cx + Math.cos(ang) * radius), Math.round(cy + Math.sin(ang) * radius * 0.8), 2, 2);
      }

      // Equalizers on both edges
      const bars = 9;
      const barW = 4;
      const seg = 3;
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i < bars; i++) {
          const x = side ? w - 3 - (i + 1) * (barW + 2) : 3 + i * (barW + 2);
          const level = (0.2 + 0.8 * Math.abs(Math.sin(t / (170 + i * 41) + i + side * 2))) * (0.75 + 0.35 * pulse);
          const tall = Math.floor((h * 0.5 * level) / seg);
          for (let s = 0; s < tall; s++) {
            const f = s / Math.max(1, (h * 0.5) / seg);
            ctx.fillStyle = rgba(f < 0.5 ? COLORS[3] : f < 0.8 ? COLORS[2] : COLORS[0], 0.85 * fade);
            ctx.fillRect(x, h - (s + 1) * seg, barW, seg - 1);
          }
        }
      }

      // Strobe on every eighth beat
      if (bi % 8 === 0 && phase < 0.35) {
        ctx.fillStyle = `rgba(255,255,255,${(1 - phase / 0.35) * 0.45 * fade})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Confetti
      for (const b of bits) {
        b.y += b.vy * (dt / 16);
        if (b.y > h + 2) b.y = -2;
        if (b.y < 0) continue;
        ctx.fillStyle = rgba(b.color, 0.95 * fade);
        ctx.fillRect(Math.round(b.x + Math.sin(t / 400 + b.phase) * b.sway), Math.round(b.y), 2, 2);
      }

      // Title, in a colour that changes on the beat
      ctx.globalCompositeOperation = "source-over";
      const size = Math.max(10, Math.round(h * 0.1 * (1 + 0.12 * pulse)));
      ctx.font = `${size}px Tiny5, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#000";
      ctx.fillText("PARTY TIME", w / 2 + 1, h * 0.12 + 1);
      ctx.fillStyle = rgba(COLORS[bi % COLORS.length], 1);
      ctx.fillText("PARTY TIME", w / 2, h * 0.12);
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(frame);
  }

  function end() {
    if (!canvas) return;
    canvas.remove();
    canvas = null;
    document.body.classList.remove("party-on");
    document.body.classList.add("party-ending");
    setTimeout(() => document.body.classList.remove("party-ending"), 700);
    window.dispatchEvent(new Event("party:end"));
  }

  window.addEventListener("pagehide", end);
})();
