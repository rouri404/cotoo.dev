// Tux mascot: a 3D model rasterized into text characters on a canvas.
// Model: "Tux" by Andy Cuccaro (CC BY 4.0), reduced by scripts/build-tux-model.js
//
// One fixed layer that moves around the screen:
//   home hero    -> bottom center
//   home menu    -> waits at the end of the page, with a speech bubble
//   blog         -> bottom left corner, out of the way (or at the end of the page on narrow screens)
// Pages are separate documents, so the last position is kept in sessionStorage and Tux glides from there.
(function () {
  const hero = document.getElementById("stage-hero");
  const isHome = !!hero;
  const isPost = document.body.classList.contains("page-post");
  const isIndex = document.body.classList.contains("page-index");
  if (!isHome && !isPost && !isIndex) return;

  const STORE_KEY = "mascot-pos";
  const MODEL_URL = "/assets/models/tux.bin";
  const REPO_URL = "https://github.com/rouri404/cotoo.dev";
  const BUBBLE_TEXT = isHome ? "curtiu o site? da uma estrelinha lá :p" : "bora ler um post? escolhe um aí :)";
  const CREDIT_GAP = 24;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Where Tux was when the previous page closed
  let saved = null;
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (Date.now() - s.t < 8000) saved = s;
    }
    sessionStorage.removeItem(STORE_KEY);
  } catch (_) {}

  // Layer
  const box = document.createElement("div");
  box.className = "mascot-box";
  box.hidden = true;
  box.innerHTML =
    (isHome || isIndex
      ? `<div class="mascot-bubble"><svg class="mascot-bubble-art" aria-hidden="true"></svg>${
          isHome
            ? `<a class="mascot-bubble-text" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">`
            : '<span class="mascot-bubble-text">'
        }<span class="on"></span><span class="off">${BUBBLE_TEXT}</span>${isHome ? "</a>" : "</span>"}</div>`
      : "") +
    '<canvas id="mascot" class="mascot" aria-hidden="true"></canvas>' +
    '<button class="mascot-hit" type="button" aria-label="Tux, o mascote do Linux. Clique para fazê-lo girar"></button>';
  document.body.appendChild(box);

  const canvas = box.querySelector("canvas");
  const hit = box.querySelector(".mascot-hit");
  const bubble = box.querySelector(".mascot-bubble");
  const bubbleArt = box.querySelector(".mascot-bubble-art");
  const bubbleText = box.querySelector(".mascot-bubble-text");
  const bubbleOn = box.querySelector(".mascot-bubble .on");
  const bubbleOff = box.querySelector(".mascot-bubble .off");
  const ctx = canvas.getContext("2d");

  // The block Tux follows when he waits at the end of a page
  let spot = null;
  const spotParent = isHome ? document.querySelector(".scroll-wrapper") : document.querySelector(".blog-main");
  if (spotParent) {
    spot = document.createElement("div");
    spot.className = "mascot-spot";
    spot.setAttribute("aria-hidden", "true");
    spotParent.appendChild(spot);
  }

  // Characters ordered by ink density, from empty to solid
  const RAMP = " .,:;i1tfLCG08@";
  const FONT = 'ui-monospace, "DejaVu Sans Mono", Menlo, Consolas, monospace';

  // Material: 0 black, 1 white, 2 accent (beak and feet)
  const ALBEDO = [0.16, 0.95, 0.62];

  // Subsamples per cell side: they give the edges a coverage instead of a hard cut
  const SS = 2;

  // The canvas is larger than his box (see .mascot in mascot.css), so that hopping and somersaulting
  // never reach its edges. The model keeps the same size on screen.
  const PAD = 1.6;

  // Camera and light
  const CAM_Z = 6;
  const HALF = 1.6;
  const LIGHT = (() => {
    const l = [-0.45, 0.65, 0.62];
    const n = Math.hypot(l[0], l[1], l[2]);
    return [l[0] / n, l[1] / n, l[2] / n];
  })();

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  // Static per-cell noise so neighbouring glyphs vary without flickering
  const hash = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  async function loadModel() {
    const res = await fetch(MODEL_URL);
    if (!res.ok) throw new Error("model not found");
    const buf = await res.arrayBuffer();
    const dv = new DataView(buf);
    if (dv.getUint32(0, false) !== 0x54555831) throw new Error("bad model file");

    const V = dv.getUint32(4, true);
    const T = dv.getUint32(8, true);
    const extent = dv.getFloat32(12, true);
    const even = (n) => n + (n % 2);

    const q = new Int16Array(buf, 16, V * 3);
    const pos = new Float32Array(V * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = (q[i] / 32767) * extent;

    const nStart = 16 + V * 6;
    const nq = new Int8Array(buf, nStart, V * 3);
    const nor = new Float32Array(V * 3);
    for (let i = 0; i < nor.length; i++) nor[i] = nq[i] / 127;

    const mats = new Uint8Array(buf, nStart + even(V * 3), V);
    const idx = new Uint16Array(buf, nStart + even(V * 3) + even(V), T * 3);
    return {
      V, T, pos, nor, mats, idx,
      sx: new Float32Array(V), sy: new Float32Array(V), sz: new Float32Array(V), lum: new Float32Array(V),
    };
  }

  // Size and screen position
  let vw = 0, vh = 0, W = 0, H = 0;

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    // Sized so that he fits under the hero text
    const hMax = Math.min(0.27 * vh, vh / 2 - 170, 260);
    W = Math.max(110, Math.min((hMax * 300) / 340, vw * 0.42));
    H = (W * 340) / 300;
    box.style.width = W + "px";
    box.style.height = H + "px";
    if (spot) spot.style.height = Math.round(H + 134 + 44) + "px";
  }

  const heroActive = () => hero.classList.contains("active");

  function follow() {
    if (!spot) return { mode: "away", x: (vw - W) / 2, y: vh + 40 };
    const r = spot.getBoundingClientRect();
    return { mode: "follow", x: r.left + (r.width - W) / 2, y: r.bottom - H - CREDIT_GAP - 20 };
  }

  function targetFor() {
    if (isHome) {
      if (heroActive()) {
        if (vh < 560) return { mode: "away", x: (vw - W) / 2, y: vh + 40 };
        return { mode: "fixed", x: (vw - W) / 2, y: vh - H - CREDIT_GAP - (vw < 700 ? 100 : 48) };
      }
      return follow();
    }

    // Blog: the bottom left corner when there is room beside the text (the right side has the table of
    // contents), else the end of the page
    if (vw >= 2 * W + 856) return { mode: "fixed", x: 24, y: vh - H - CREDIT_GAP - 44 };
    return follow();
  }

  let pos = null;
  let mode = "";
  let modeSince = 0;
  let onScreen = false;

  function updatePosition(now, dt) {
    const t = targetFor();
    if (t.mode !== mode) {
      mode = t.mode;
      modeSince = now;
    }
    const k = 1 - Math.exp(-dt / 140);
    // At the end of a page he sticks to the page, so scrolling does not make him lag behind
    if (mode === "follow" && now - modeSince > 1400) {
      pos.x = t.x;
      pos.y = t.y;
    } else {
      pos.x += (t.x - pos.x) * k;
      pos.y += (t.y - pos.y) * k;
    }
    box.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    onScreen = pos.y + H > 0 && pos.y < vh && pos.x + W > 0 && pos.x < vw;
  }

  // Thought bubble: a pixel-art cloud up and to the side of his head, joined to it by a trail of dots
  const CELL = 2;
  const ANGLE = (38 * Math.PI) / 180;
  const SVG_NS = "http://www.w3.org/2000/svg";

  // The trail: distance from the cloud's edge in px, and radius in cells
  const DOTS = [[10, 4.5], [27, 3.2], [40, 2]];
  const TRAIL = 46;

  let bw = 0, bh = 0;
  let typedAt = 0;
  let typedLen = -1;
  let typingDone = false;
  // Set when a post is opened: the bubble fades out before the page changes
  let leaving = false;

  // Rows of runs, as one path of rectangles
  function cellsToPath(cells) {
    const rowsMap = new Map();
    for (const [i, j] of cells) {
      if (!rowsMap.has(j)) rowsMap.set(j, []);
      rowsMap.get(j).push(i);
    }
    let d = "";
    for (const [j, list] of rowsMap) {
      list.sort((x, y) => x - y);
      let start = list[0], prev = start;
      for (let k = 1; k <= list.length; k++) {
        if (k < list.length && list[k] === prev + 1) {
          prev = list[k];
          continue;
        }
        d += `M${start * CELL} ${j * CELL}h${(prev - start + 1) * CELL}v${CELL}h${-(prev - start + 1) * CELL}z`;
        if (k < list.length) start = prev = list[k];
      }
    }
    return d;
  }

  function addPath(cls, cells) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", cls);
    path.setAttribute("d", cellsToPath(cells));
    bubbleArt.appendChild(path);
  }

  // Splits the cells of a shape into its outline (one cell thick) and its inside
  function outline(inside, i0, i1, j0, j1) {
    const edge = [], fill = [];
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (!inside(i, j)) continue;
        const isEdge = !inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || !inside(i, j + 1);
        (isEdge ? edge : fill).push([i, j]);
      }
    }
    return { edge, fill };
  }

  // Size the cloud to its text, so that the text sits inside it
  function sizeBubble() {
    const tw = bubbleText.offsetWidth;
    const th = bubbleText.offsetHeight;
    if (!tw || !th) return false;
    bw = Math.ceil((tw * 1.32 + 16) / CELL) * CELL;
    bh = Math.ceil((th * 1.5 + 14) / CELL) * CELL;
    bubble.style.width = bw + "px";
    bubble.style.height = bh + "px";
    return true;
  }

  function drawBubble(vx, vy) {
    const gw = bw / CELL, gh = bh / CELL;
    const rx = gw / 2, ry = gh / 2;

    // A core ellipse with round bumps around its rim
    const r = Math.max(3, Math.round(gh * 0.26));
    const A = rx - r, B = ry - r;
    const n = Math.max(8, Math.round((2 * Math.PI * Math.sqrt((A * A + B * B) / 2)) / (r * 1.25)));
    const bumps = [];
    for (let k = 0; k < n; k++) {
      const phi = (2 * Math.PI * k) / n;
      bumps.push([rx + A * Math.cos(phi), ry + B * Math.sin(phi)]);
    }
    const coreX = rx - r * 0.8, coreY = ry - r * 0.8;
    const cloud = (i, j) => {
      if (i < 0 || j < 0 || i >= gw || j >= gh) return false;
      const x = i + 0.5, y = j + 0.5;
      const dx = (x - rx) / coreX, dy = (y - ry) / coreY;
      if (dx * dx + dy * dy <= 1) return true;
      return bumps.some(([bx, by]) => (x - bx) * (x - bx) + (y - by) * (y - by) <= r * r);
    };
    const shape = outline(cloud, 0, gw - 1, 0, gh - 1);

    bubbleArt.replaceChildren();
    bubbleArt.setAttribute("width", bw);
    bubbleArt.setAttribute("height", bh);
    addPath("b", shape.edge);
    addPath("f", shape.fill);

    // Dots from the cloud towards his head, each smaller than the last
    const len = Math.hypot(vx, vy) || 1;
    const ux = vx / len, uy = vy / len;
    const rim = 1 / Math.hypot(ux / (bw / 2), uy / (bh / 2)) - 2;
    let lastX = 0, lastY = 0;
    for (const [d, rc] of DOTS) {
      const cx = (bw / 2 + ux * (rim + d)) / CELL;
      const cy = (bh / 2 + uy * (rim + d)) / CELL;
      const dot = (i, j) => (i + 0.5 - cx) * (i + 0.5 - cx) + (j + 0.5 - cy) * (j + 0.5 - cy) <= rc * rc;
      const parts = outline(dot, Math.floor(cx - rc - 1), Math.ceil(cx + rc + 1), Math.floor(cy - rc - 1), Math.ceil(cy + rc + 1));
      addPath("b", parts.edge);
      addPath("f", parts.fill);
      lastX = cx * CELL;
      lastY = cy * CELL;
    }

    // The cloud pops out from the last dot
    bubble.style.transformOrigin = `${lastX}px ${lastY}px`;
  }

  // On the blog index the cloud must not cover the list, so it needs the free space left of the text
  function fitsBeside() {
    if (isHome || mode !== "fixed") return true;
    const main = document.querySelector(".blog-main");
    if (!main) return true;
    if (!bw) sizeBubble();
    return main.getBoundingClientRect().left - 24 >= bw;
  }

  function placeBubble() {
    if (!bubble || (!bw && !sizeBubble())) return;
    const a = bw / 2, b = bh / 2;
    // Where his head is inside the layer
    const hx = W / 2, hy = H * 0.2, rh = H * 0.15;
    const ang = isHome ? ANGLE : (72 * Math.PI) / 180;
    const re = 1 / Math.hypot(Math.cos(ang) / a, Math.sin(ang) / b);
    const dist = re + rh + TRAIL;

    let side = 1;
    if (pos.x + hx + dist * Math.cos(ang) + a > vw - 8) side = -1;
    let cx = hx + side * dist * Math.cos(ang);
    const cy = hy - dist * Math.sin(ang);

    // Keep it inside the screen
    const absLeft = pos.x + cx - a;
    let maxLeft = vw - 8 - bw;
    const main = !isHome && mode === "fixed" && document.querySelector(".blog-main");
    if (main) maxLeft = Math.min(maxLeft, main.getBoundingClientRect().left - 16 - bw);
    cx += clamp(absLeft, 8, Math.max(8, maxLeft)) - absLeft;

    bubble.style.left = cx - a + "px";
    bubble.style.top = cy - b + "px";
    drawBubble(hx - cx, hy - cy);
  }

  function refitBubble() {
    if (!bubble) return;
    bw = 0;
    if (pos && bubble.classList.contains("is-on")) placeBubble();
  }

  function updateBubble(now) {
    if (!bubble) return;
    const rel = parseFloat(bubble.style.top);
    const top = pos.y + (isNaN(rel) ? -90 : rel);
    const placed = isHome ? mode === "follow" && now - modeSince > 900 : isIndex && now - modeSince > 1800;
    const want = placed && !leaving && onScreen && top > 8 && fitsBeside();
    const isOn = bubble.classList.contains("is-on");
    if (want && !isOn) {
      placeBubble();
      bubble.classList.add("is-on");
      typedAt = now;
      typedLen = -1;
    } else if (!want && isOn) {
      bubble.classList.remove("is-on");
    }
    if (!want) return;

    // He types only the first time: opening the contact form moves the page, and the bubble must not start over
    const total = BUBBLE_TEXT.length;
    const n = typingDone || reduceMotion.matches ? total : clamp(Math.floor((now - typedAt - 250) / 38), 0, total);
    if (n === total) typingDone = true;
    if (n !== typedLen) {
      typedLen = n;
      bubbleOn.textContent = BUBBLE_TEXT.slice(0, n);
      bubbleOff.textContent = BUBBLE_TEXT.slice(n);
    }
  }

  // Canvas layout and raster buffers
  let dpr = 1, cssW = 0, cssH = 0, cols = 0, rows = 0, cellW = 0, cellH = 0, SW = 0, SH = 0;
  let zbuf, lbuf, mbuf, hbuf;

  function layout() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = rect.width;
    cssH = rect.height;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    cellW = Math.max(5, Math.round(cssW / PAD / 56));
    cellH = Math.round(cellW * 1.7);
    cols = Math.floor(cssW / cellW);
    rows = Math.floor(cssH / cellH);
    SW = cols * SS;
    SH = rows * SS;
    zbuf = new Float32Array(SW * SH);
    lbuf = new Float32Array(SW * SH);
    mbuf = new Uint8Array(SW * SH);
    hbuf = new Uint8Array(SW * SH);
  }

  function render(model, yaw, pitch, lift) {
    if (!cols || !rows) return;
    const style = getComputedStyle(canvas);
    const textColor = style.color;
    const colors = [
      textColor,
      style.getPropertyValue("--mascot-white").trim() || textColor,
      style.getPropertyValue("--mascot-accent").trim() || textColor,
    ];
    const theme = canvas.getAttribute("data-theme") || document.documentElement.getAttribute("data-theme") || "light";
    const isDark = theme === "dark";

    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const aspect = (cols * cellW) / (rows * cellH);
    const half = HALF * PAD;
    const { V, T, pos: P, nor, mats, idx, sx, sy: sY, sz, lum } = model;

    // Vertices: turn the model, project it and light it once per vertex
    for (let i = 0; i < V; i++) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      const z1 = -x * sy + z * cy;
      const x1 = x * cy + z * sy;
      const y2 = y * cp - z1 * sp + lift;
      const z2 = y * sp + z1 * cp;
      const depth = CAM_Z - z2;
      const k = CAM_Z / depth;
      sx[i] = ((x1 * k) / (half * aspect) * 0.5 + 0.5) * SW;
      sY[i] = (0.5 - ((y2 * k) / half) * 0.5) * SH;
      sz[i] = depth;

      const nx = nor[i * 3], ny = nor[i * 3 + 1], nz = nor[i * 3 + 2];
      const nz1 = -nx * sy + nz * cy;
      const nx1 = nx * cy + nz * sy;
      const ny2 = ny * cp - nz1 * sp;
      const nz2 = ny * sp + nz1 * cp;
      const diff = Math.max(0, nx1 * LIGHT[0] + ny2 * LIGHT[1] + nz2 * LIGHT[2]);
      const r = 1 - Math.max(0, nz2);
      const m = mats[i];
      // A black body would vanish on a dark page, so it gets a little more ink there
      const albedo = isDark && m === 0 ? 0.3 : ALBEDO[m];
      lum[i] = albedo * (0.22 + diff * 0.85) + r * r * r * 0.28;
    }

    // Triangles into the depth buffer
    zbuf.fill(Infinity);
    hbuf.fill(0);
    for (let t = 0; t < T; t++) {
      const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2];
      const x0 = sx[a], y0 = sY[a], x1 = sx[b], y1 = sY[b], x2 = sx[c], y2 = sY[c];
      const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      if (area >= 0) continue;

      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
      const maxX = Math.min(SW - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
      const maxY = Math.min(SH - 1, Math.ceil(Math.max(y0, y1, y2)));
      if (minX > maxX || minY > maxY) continue;

      const inv = 1 / area;
      const z0 = sz[a], z1 = sz[b], z2 = sz[c];
      const l0 = lum[a], l1 = lum[b], l2 = lum[c];
      const m = mats[a];
      for (let py = minY; py <= maxY; py++) {
        const pyc = py + 0.5;
        for (let px = minX; px <= maxX; px++) {
          const pxc = px + 0.5;
          const w0 = ((x2 - x1) * (pyc - y1) - (y2 - y1) * (pxc - x1)) * inv;
          const w1 = ((x0 - x2) * (pyc - y2) - (y0 - y2) * (pxc - x2)) * inv;
          const w2 = ((x1 - x0) * (pyc - y0) - (y1 - y0) * (pxc - x0)) * inv;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const z = w0 * z0 + w1 * z1 + w2 * z2;
          const p = py * SW + px;
          if (z < zbuf[p]) {
            zbuf[p] = z;
            lbuf[p] = w0 * l0 + w1 * l1 + w2 * l2;
            mbuf[p] = m;
            hbuf[p] = 1;
          }
        }
      }
    }

    // Cells: coverage, average light and the material that covers most of them
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.font = `${cellH}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const offX = (cssW - cols * cellW) / 2;
    const offY = (cssH - rows * cellH) / 2;
    let lastColor = "";

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        let count = 0, sum = 0, m0 = 0, m1 = 0, m2 = 0;
        for (let v = 0; v < SS; v++) {
          for (let u = 0; u < SS; u++) {
            const p = (j * SS + v) * SW + i * SS + u;
            if (!hbuf[p]) continue;
            count++;
            sum += lbuf[p];
            const m = mbuf[p];
            if (m === 0) m0++; else if (m === 1) m1++; else m2++;
          }
        }
        if (count < 2) continue;

        const material = m1 >= m0 && m1 >= m2 ? 1 : m2 > m0 ? 2 : 0;
        const lo = isDark ? 0.14 : 0;
        const l = clamp(sum / count + (hash(i, j) - 0.5) * 0.06, lo, 1);

        // Dark theme draws light parts with more ink, light theme the opposite
        const ink = clamp(isDark ? l : 1 - l * 0.92, 0.1, 1);
        const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(ink * RAMP.length))];
        if (ch === " ") continue;

        const color = colors[material];
        if (color !== lastColor) {
          ctx.fillStyle = color;
          lastColor = color;
        }
        ctx.fillText(ch, offX + (i + 0.5) * cellW, offY + (j + 0.5) * cellH);
      }
    }
  }

  // Motion
  let model = null;
  let yaw = -0.4, pitch = 0;
  let spinStart = -1;
  let flipStart = -1;
  let pointer = null;
  let lastMove = -1e9;
  let last = 0;
  let acc = 0;

  const SPIN_MS = 1200;
  const FLIP_MS = 650;
  const PARTY_MS = 2400;
  let partyStart = -1;

  // Konami code easter egg (also reachable with a "mascot:party" event): three spins, three hops and confetti
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let konamiAt = 0;

  function confetti() {
    if (!pos) return;
    const style = getComputedStyle(box);
    const palette = [style.color, style.getPropertyValue("--mascot-accent").trim(), style.getPropertyValue("--mascot-white").trim()].filter(Boolean);
    const ox = pos.x + W / 2;
    const oy = pos.y + H * 0.35;
    for (let i = 0; i < 36; i++) {
      const dot = document.createElement("i");
      dot.className = "mascot-confetti";
      dot.style.background = palette[i % palette.length];
      dot.style.left = ox + "px";
      dot.style.top = oy + "px";
      document.body.appendChild(dot);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const speed = 160 + Math.random() * 260;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      dot.animate(
        [
          { transform: "translate(0, 0)", opacity: 1 },
          { transform: `translate(${dx * 0.6}px, ${dy * 0.6}px)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${dx}px, ${dy + 380}px)`, opacity: 0 },
        ],
        { duration: 1300 + Math.random() * 600, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)", delay: Math.random() * 120 }
      ).onfinish = () => dot.remove();
    }
  }

  function party() {
    if (reduceMotion.matches) return;
    partyStart = performance.now();
    confetti();
  }

  window.addEventListener("mascot:party", party);
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiAt = key === KONAMI[konamiAt] ? konamiAt + 1 : key === KONAMI[0] ? 1 : 0;
    if (konamiAt === KONAMI.length) {
      konamiAt = 0;
      party();
    }
  });

  function spin(now) {
    if (spinStart < 0 || now - spinStart > SPIN_MS) spinStart = now;
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      pointer = { x: e.clientX, y: e.clientY };
      lastMove = performance.now();
    },
    { passive: true }
  );

  hit.addEventListener("click", (e) => {
    e.stopPropagation();
    // Keyboard presses are handled on keydown
    if (e.detail > 0 && !reduceMotion.matches) spin(performance.now());
  });
  hit.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      // The page also uses these keys to leave the hero
      e.preventDefault();
      e.stopPropagation();
      if (!reduceMotion.matches) spin(performance.now());
    }
  });

  // A somersault when the theme changes, as the dither wave starts to sweep
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener(
      "click",
      () => {
        if (!reduceMotion.matches) flipStart = performance.now() + 100;
      },
      true
    );
  }

  // Opening a post: let the bubble fade out first, then follow the link
  if (isIndex && bubble) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith("/blog/") || url.pathname === location.pathname) return;
      if (!bubble.classList.contains("is-on")) return;
      e.preventDefault();
      leaving = true;
      setTimeout(() => (location.href = url.href), reduceMotion.matches ? 0 : 320);
    });
  }

  // Remember where he is, for the next page
  window.addEventListener("pagehide", () => {
    try {
      if (!pos || box.hidden) sessionStorage.removeItem(STORE_KEY);
      else {
        // The last frame goes along, so the next page can show him at once while the model loads
        let img = "";
        try {
          if (model && onScreen) img = canvas.toDataURL("image/png");
        } catch (_) {}
        sessionStorage.setItem(STORE_KEY, JSON.stringify({ x: pos.x, y: pos.y, yaw, pitch, img, t: Date.now() }));
      }
    } catch (_) {}
  });

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(100, now - last);
    last = now;
    if (!pos) return;

    updatePosition(now, dt);
    updateBubble(now);

    if (!model || document.hidden || !onScreen) return;

    // 30 fps is plenty for ASCII, and 4 fps when motion is reduced (only to follow theme changes)
    acc += dt;
    const step = reduceMotion.matches ? 250 : 33;
    if (acc < step) return;
    acc = 0;

    let lift = 0;
    let spinYaw = 0;
    let flipPitch = 0;
    if (!reduceMotion.matches) {
      const t = now / 1000;
      let targetYaw = 0.45 * Math.sin(t * 0.7) - 0.15;
      let targetPitch = 0.04 * Math.sin(t * 1.3);

      if (pointer && now - lastMove < 4000) {
        const rect = canvas.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cyy = rect.top + rect.height / 2;
        targetYaw = clamp(((pointer.x - cx) / (window.innerWidth / 2)) * 1.0, -1, 1);
        targetPitch = clamp(((pointer.y - cyy) / (window.innerHeight / 2)) * 0.3, -0.3, 0.3);
      }

      yaw += (targetYaw - yaw) * 0.1;
      pitch += (targetPitch - pitch) * 0.1;

      if (spinStart >= 0) {
        const p = (now - spinStart) / SPIN_MS;
        if (p >= 1) {
          spinStart = -1;
        } else {
          spinYaw = ease(p) * Math.PI * 2;
          lift = Math.max(lift, Math.sin(Math.PI * Math.min(1, p * 1.4)) * 0.3);
        }
      }

      if (partyStart >= 0) {
        const p = (now - partyStart) / PARTY_MS;
        if (p >= 1) {
          partyStart = -1;
        } else {
          spinYaw += ease(p) * Math.PI * 6;
          lift = Math.max(lift, Math.abs(Math.sin(p * Math.PI * 3)) * 0.35);
        }
      }

      if (flipStart >= 0 && now >= flipStart) {
        const p = (now - flipStart) / FLIP_MS;
        if (p >= 1) {
          flipStart = -1;
        } else {
          flipPitch = ease(p) * Math.PI * 2;
          lift = Math.max(lift, Math.sin(Math.PI * p) * 0.4);
        }
      }
    } else {
      yaw = -0.35;
      pitch = 0;
    }

    render(model, yaw + spinYaw, pitch + flipPitch, lift);
  }

  measure();
  window.addEventListener("resize", () => {
    measure();
    refitBubble();
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refitBubble);
  if ("ResizeObserver" in window) {
    new ResizeObserver(layout).observe(canvas);
  } else {
    window.addEventListener("resize", layout);
  }

  // Coming from another page: show his last frame right away, in the same place, until the model is ready
  let snap = null;
  if (saved) {
    pos = { x: clamp(saved.x, -W, vw), y: clamp(saved.y, -H, vh + H) };
    if (typeof saved.yaw === "number") yaw = saved.yaw;
    if (typeof saved.pitch === "number") pitch = saved.pitch;
    if (typeof saved.img === "string" && saved.img.startsWith("data:image/png")) {
      snap = document.createElement("img");
      snap.className = "mascot";
      snap.alt = "";
      snap.setAttribute("aria-hidden", "true");
      snap.src = saved.img;
      box.insertBefore(snap, canvas);
      updatePosition(performance.now(), 16);
      box.hidden = false;
    }
  }

  loadModel()
    .then((m) => {
      model = m;

      // Start where he was, or rise from below the screen
      if (!pos) pos = { x: targetFor().x, y: vh + 40 };

      layout();
      updatePosition(performance.now(), 16);
      if (snap) {
        // Draw the first real frame, then drop the picture
        acc = 1e9;
        requestAnimationFrame(() => requestAnimationFrame(() => snap.remove()));
      }
      box.hidden = false;

      // A hello spin when he first shows up
      if (!saved && !reduceMotion.matches) setTimeout(() => spin(performance.now()), 600);
    })
    .catch(() => box.remove());

  requestAnimationFrame(frame);
})();
