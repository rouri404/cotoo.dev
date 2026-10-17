// Party light show: a low-resolution pixel canvas behind Tux. Everything has its own corner: a disco ball and the title on top,
// beams from the top corners, equalizers in the bottom corners, backup dancers on the dance floor. Each party draws from one
// "mood" of three colours, so the screen never turns into a rainbow. Started by mascot.js (the "party:start" event).
// Every colour here is a fixed neon on purpose, so none of it depends on the theme.
(function () {
  const BEAT_MS = 476; // 126 bpm, the same beat Tux dances to
  const LEAVE_MS = 900; // Same as mascot.js: how long Tux takes to shrink back
  const SOUND_KEY = "party-sound";
  const COLORS = [
    [255, 46, 147],
    [0, 229, 255],
    [255, 230, 0],
    [124, 255, 58],
    [179, 107, 255],
    [255, 122, 0],
  ];
  // Indexes into COLORS: rave, disco and neon
  const MOODS = [
    [0, 1, 4],
    [2, 5, 0],
    [3, 1, 2],
  ];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const hash = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  // Backup dancer: B body (mood colour), W belly, Y beak and feet
  const TUX = [
    "...BBBBB...",
    "..BBBBBBB..",
    "..BWBBBWB..",
    "..BBBYBBB..",
    "...BBYBB...",
    ".BBWWWWWBB.",
    "BBBWWWWWBBB",
    "BBBWWWWWBBB",
    ".BBWWWWWBB.",
    "..BWWWWWB..",
    "..YYY.YYY..",
  ];

  let canvas = null;
  let lastMood = -1;

  // Sound: a beat made in the browser (no audio files), on by default only where there is a mouse
  const readSoundPref = () => {
    try {
      const v = localStorage.getItem(SOUND_KEY);
      if (v) return v === "on";
    } catch (_) {}
    return !window.matchMedia("(pointer: coarse)").matches;
  };
  const saveSoundPref = (on) => {
    try {
      localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    } catch (_) {}
  };

  let audio = null;

  function startAudio(t0, duration) {
    if (audio) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      ctx.resume().catch(() => {});
      const comp = ctx.createDynamicsCompressor();
      const out = ctx.createGain();
      out.gain.value = 0.5;
      out.connect(comp);
      comp.connect(ctx.destination);

      const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const env = (node, when, peak, dur) => {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(peak, when + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        node.connect(g);
        g.connect(out);
      };
      const tone = (type, freq, when, peak, dur, cutoff) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = freq;
        let node = o;
        if (cutoff) {
          const f = ctx.createBiquadFilter();
          f.type = "lowpass";
          f.frequency.value = cutoff;
          o.connect(f);
          node = f;
        }
        env(node, when, peak, dur);
        o.start(when);
        o.stop(when + dur + 0.05);
      };
      const hiss = (type, freq, when, peak, dur) => {
        const s = ctx.createBufferSource();
        s.buffer = noise;
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        s.connect(f);
        env(f, when, peak, dur);
        s.start(when);
      };

      // The beat grid starts where the visuals do (a little later, for the audio latency)
      const base = ctx.currentTime - (performance.now() - t0) / 1000 + 0.05;
      const eighth = BEAT_MS / 2000;
      const bass = [55, 55, 82.41, 65.41];
      for (let s = 0; s * eighth < duration / 1000; s++) {
        const when = base + s * eighth;
        if (when < ctx.currentTime) continue;
        if (s % 2 === 0) {
          const k = ctx.createOscillator();
          k.frequency.setValueAtTime(150, when);
          k.frequency.exponentialRampToValueAtTime(45, when + 0.12);
          env(k, when, 0.9, 0.22);
          k.start(when);
          k.stop(when + 0.3);
        } else {
          hiss("highpass", 7000, when, 0.08, 0.05);
          tone("sawtooth", bass[((s - 1) / 2) % 4], when, 0.26, 0.18, 380);
        }
        if (s % 8 === 2 || s % 8 === 6) hiss("bandpass", 1800, when, 0.2, 0.12);
        if (s % 8 === 0) for (const f of [220, 261.63, 329.63]) tone("triangle", f, when, 0.04, 0.4);
        if (s % 16 === 8) for (const f of [174.61, 220, 261.63]) tone("triangle", f, when, 0.04, 0.4);
      }
      audio = { ctx, out };
    } catch (_) {
      audio = null;
    }
  }

  function stopAudio() {
    if (!audio) return;
    const { ctx, out } = audio;
    audio = null;
    try {
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      setTimeout(() => ctx.close().catch(() => {}), 600);
    } catch (_) {}
  }

  window.addEventListener("party:start", (e) => start((e.detail && e.detail.ms) || 8000));

  function start(duration) {
    if (canvas) return;

    // One canvas pixel is several screen pixels, so everything comes out chunky
    const px = Math.max(3, Math.round(Math.max(window.innerWidth, window.innerHeight) / 420));
    const w = Math.ceil(window.innerWidth / px);
    const h = Math.ceil(window.innerHeight / px);
    const small = window.innerWidth < 700;
    // Backup dancers need the wide floor of a landscape screen
    const dancers = w / h > 1.2;
    canvas = document.createElement("canvas");
    canvas.className = "party-lights";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = w;
    canvas.height = h;
    document.body.appendChild(canvas);
    // Everything else on the page fades out for the show (see mascot.css)
    document.body.classList.add("party-on");
    const ctx = canvas.getContext("2d");

    // A different mood every time
    let mood = Math.floor(Math.random() * MOODS.length);
    if (mood === lastMood) mood = (mood + 1) % MOODS.length;
    lastMood = mood;
    const palette = MOODS[mood].map((i) => COLORS[i]);

    const t0 = performance.now();

    // Controls: the way out, and the sound
    const controls = document.createElement("div");
    controls.className = "party-controls";
    const soundBtn = document.createElement("button");
    const stopBtn = document.createElement("button");
    for (const b of [soundBtn, stopBtn]) {
      b.type = "button";
      b.className = "party-btn";
      controls.appendChild(b);
    }
    stopBtn.textContent = "sair";
    stopBtn.setAttribute("aria-label", "Encerrar a festa");
    const showSound = () => {
      soundBtn.textContent = audio ? "som: on" : "som: off";
      soundBtn.setAttribute("aria-pressed", audio ? "true" : "false");
    };
    document.body.appendChild(controls);

    let ending = false;
    function stop() {
      if (ending) return;
      ending = true;
      duration = Math.min(duration, performance.now() - t0 + LEAVE_MS);
      stopAudio();
      window.dispatchEvent(new Event("party:stop"));
    }

    if (readSoundPref()) {
      startAudio(t0, duration);
      // Browsers that refuse sound without a recent tap leave it suspended: show that honestly
      setTimeout(() => {
        if (audio && audio.ctx.state !== "running") stopAudio();
        showSound();
      }, 250);
    }
    showSound();

    soundBtn.addEventListener("click", () => {
      if (audio) {
        stopAudio();
        saveSoundPref(false);
      } else if (!ending) {
        startAudio(t0, duration);
        saveSoundPref(true);
      }
      showSound();
    });
    stopBtn.addEventListener("click", stop);
    const onKey = (e) => {
      if (e.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKey, true);

    // Taps and clicks throw a little confetti where they land
    const burst = [];
    let kick = -1e9;
    const onTap = (e) => {
      if (ending || (e.target.closest && e.target.closest(".party-controls"))) return;
      kick = performance.now();
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 0.5 + Math.random() * 1.6;
        burst.push({
          x: e.clientX / px,
          y: e.clientY / px,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 1,
          born: kick,
          color: palette[Math.floor(Math.random() * 3)],
        });
      }
    };
    window.addEventListener("pointerdown", onTap, true);

    const tile = 6;
    const floorTop = Math.floor((h * 0.72) / tile) * tile;
    const bits = Array.from({ length: small ? 36 : 80 }, () => ({
      x: Math.random() * w,
      y: -Math.random() * h,
      vy: 0.25 + Math.random() * 0.55,
      sway: 1 + Math.random() * 5,
      phase: Math.random() * 6.28,
      color: palette[Math.floor(Math.random() * 3)],
    }));
    const lamps = [0.04, 0.14, 0.86, 0.96];
    const ball = { x: Math.round(w / 2), r: Math.max(7, Math.round(h * 0.04)) };
    ball.y = ball.r + 3;
    const sparkles = small ? 5 : 10;
    let last = t0;

    function frame(now) {
      // The first frame can carry a timestamp a hair before t0, and a negative beat would index the palette with -1
      const t = Math.max(0, now - t0);
      if (t >= duration) return end();
      requestAnimationFrame(frame);
      const dt = Math.min(50, now - last);
      last = now;

      const fade = Math.min(1, t / 600, (duration - t) / 700);
      const beat = t / BEAT_MS;
      const phase = beat % 1;
      const bi = Math.floor(beat);
      const pulse = 1 - phase;
      const tapped = Math.max(0, 1 - (now - kick) / 350);
      controls.style.opacity = String(0.85 * fade);

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

      // Beams from the four top corners, aimed at Tux and kept soft
      for (let i = 0; i < lamps.length; i++) {
        const ox = w * lamps[i];
        const aim = Math.atan2(cy, cx - ox);
        const angle = aim + Math.sin(t / 1100 + i * 1.7) * 0.35;
        const spread = 0.05 + 0.02 * Math.sin(t / 600 + i);
        // On a narrow screen the beams get shorter and softer, or they would cross the whole picture
        const len = small ? Math.min(h * 1.4, w * 1.6) : h * 1.4;
        const color = palette[(i + bi) % 3];
        const grad = ctx.createLinearGradient(ox, 0, ox + Math.cos(angle) * len, Math.sin(angle) * len);
        grad.addColorStop(0, rgba(color, (small ? 0.22 : 0.3) * fade + (0.12 * pulse + 0.25 * tapped) * fade));
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
          const color = palette[Math.floor(hash(gx, gy) * 3 + bi) % 3];
          ctx.fillStyle = rgba(color, (lit ? 0.07 + (small ? 0.12 : 0.22) * pulse : 0.03) * fade);
          ctx.fillRect(x + 1, y + 1, tile - 1, tile - 1);
        }
      }

      // A ring leaves Tux on every beat
      const radius = 6 + phase * 46;
      ctx.fillStyle = rgba(palette[bi % 3], 0.45 * pulse * fade);
      for (let a = 0, steps = Math.ceil(radius * 6); a < steps; a++) {
        const ang = (a / steps) * Math.PI * 2;
        ctx.fillRect(Math.round(cx + Math.cos(ang) * radius), Math.round(cy + Math.sin(ang) * radius * 0.8), 2, 2);
      }

      // Equalizers, one in each bottom corner
      const bars = small ? 4 : 5;
      const barW = 3;
      const seg = 3;
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i < bars; i++) {
          const x = side ? w - 3 - (i + 1) * (barW + 2) : 3 + i * (barW + 2);
          const level = (0.2 + 0.8 * Math.abs(Math.sin(t / (170 + i * 41) + i + side * 2))) * (0.75 + 0.35 * pulse);
          const tall = Math.floor((h * 0.26 * level) / seg);
          for (let s = 0; s < tall; s++) {
            const f = s / Math.max(1, (h * 0.26) / seg);
            ctx.fillStyle = rgba(f < 0.5 ? palette[0] : f < 0.8 ? palette[1] : palette[2], 0.7 * fade);
            ctx.fillRect(x, h - (s + 1) * seg, barW, seg - 1);
          }
        }
      }

      if (bi % 8 === 0 && phase < 0.35) {
        ctx.fillStyle = `rgba(255,255,255,${(1 - phase / 0.35) * 0.22 * fade})`;
        ctx.fillRect(0, 0, w, h);
      }

      for (const b of bits) {
        b.y += b.vy * (dt / 16);
        if (b.y > h + 2) b.y = -2;
        if (b.y < 0) continue;
        ctx.fillStyle = rgba(b.color, 0.8 * fade);
        ctx.fillRect(Math.round(b.x + Math.sin(t / 400 + b.phase) * b.sway), Math.round(b.y), 2, 2);
      }

      // Sparkles thrown around the room by the disco ball
      for (let i = 0; i < sparkles; i++) {
        const ang = i * 2.4 + t / 1600;
        const rad = ball.r * 2 + hash(i, 1) * h * 0.55;
        const x = Math.round(ball.x + Math.cos(ang) * rad * 1.5);
        const y = Math.round(ball.y + Math.abs(Math.sin(ang)) * rad * 0.9 + h * 0.1);
        if (x < 2 || x > w - 3 || y < h * 0.1 || y > floorTop) continue;
        ctx.fillStyle = rgba(palette[i % 3], (0.25 + 0.5 * Math.abs(Math.sin(t / 260 + i))) * fade);
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }

      // What follows is solid, not additive
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = fade;

      // Disco ball on its string
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(ball.x, 0, 1, ball.y - ball.r);
      const spin = Math.floor(t / 260);
      for (let fy = -ball.r; fy < ball.r; fy += 3) {
        for (let fx = -ball.r; fx < ball.r; fx += 3) {
          if (Math.hypot(fx + 1.5, fy + 1.5) > ball.r) continue;
          const col = Math.floor((fx + ball.r) / 3) + spin;
          const row = Math.floor((fy + ball.r) / 3);
          const g = 90 + Math.floor(130 * Math.abs(Math.sin(col * 1.7 + row * 0.9 + t / 300)));
          ctx.fillStyle = `rgb(${g},${g},${Math.min(255, g + 15)})`;
          ctx.fillRect(ball.x + fx, ball.y + fy, 2, 2);
        }
      }

      // Backup dancers on the floor, on both sides of Tux
      if (dancers) {
        const u = 3;
        const feet = floorTop + (h - floorTop) * 0.85;
        for (let n = 0; n < 4; n++) {
          const cxd = Math.round(w * [0.14, 0.24, 0.76, 0.86][n]);
          const turn = (bi + n) % 2 === 0;
          const jump = Math.round(Math.abs(Math.sin(Math.PI * phase)) * 3);
          const ox = cxd - Math.floor((TUX[0].length * u) / 2) + (turn ? 1 : -1);
          const oy = Math.round(feet - TUX.length * u - jump);
          for (let ry = 0; ry < TUX.length; ry++) {
            for (let rx = 0; rx < TUX[ry].length; rx++) {
              const ch = TUX[ry][rx];
              if (ch === ".") continue;
              // The flippers go up, one at a time
              const arm = ry >= 5 && ry <= 7 && (rx <= 1 || rx >= 9);
              const up = arm && (rx <= 1 ? turn : !turn) ? 3 : 0;
              ctx.fillStyle = ch === "B" ? rgba(palette[n % 3], 1) : ch === "W" ? "#f2f2ff" : "#ffd21f";
              ctx.fillRect(ox + rx * u, oy + ry * u - up, u, u);
            }
          }
        }
      }

      // Confetti thrown by taps
      for (let i = burst.length - 1; i >= 0; i--) {
        const p = burst[i];
        const age = now - p.born;
        if (age > 900) {
          burst.splice(i, 1);
          continue;
        }
        p.vy += 0.05 * (dt / 16);
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        ctx.globalAlpha = Math.min(1, (900 - age) / 300) * fade;
        ctx.fillStyle = rgba(p.color, 1);
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
      }

      // Title, centered between the ball and Tux's head
      const size = Math.max(10, Math.round(h * 0.06 * (1 + 0.08 * pulse)));
      ctx.font = `${size}px Tiny5, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#000";
      ctx.fillText("PARTY TIME", w / 2 + 1, h * 0.155 + 1);
      ctx.fillStyle = rgba(palette[bi % 3], 1);
      ctx.fillText("PARTY TIME", w / 2, h * 0.155);
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(frame);

    function end() {
      if (!canvas) return;
      stopAudio();
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onTap, true);
      controls.remove();
      canvas.remove();
      canvas = null;
      document.body.classList.remove("party-on");
      document.body.classList.add("party-ending");
      setTimeout(() => document.body.classList.remove("party-ending"), 700);
      window.dispatchEvent(new Event("party:end"));
    }
    window.addEventListener("pagehide", end, { once: true });
  }
})();
