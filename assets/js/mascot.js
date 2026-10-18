// Tux mascot: a 3D model rasterized into text characters on a canvas.
// Model: "Tux" by Andy Cuccaro (CC BY 4.0), reduced by scripts/build-tux-model.js
//
// One fixed layer that moves around the screen:
//   home hero    -> bottom center
//   home menu    -> waits at the end of the page, with a speech bubble
//   blog         -> bottom left corner, out of the way (or at the end of the page on narrow screens)
//   dragged      -> on the home hero only, he stays wherever he was dropped until the tab is closed; the menu and the blog always send him back to their own spot
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
  // The text he shows by himself; posts have none, only the short comments from say()
  const BUBBLE_TEXT = isHome ? "curtiu o site? da uma estrelinha lá :p" : isIndex ? "bora ler um post? escolhe um aí :)" : "";
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

  // Where he was dropped after a drag, as fractions of the free room so it holds on any screen size
  const PERCH_KEY = "mascot-perch";
  // A fingertip wobbles more than a mouse, so a tap must not turn into a drag too easily
  const DRAG_PX = { mouse: 6, touch: 12 };
  let perch = null;
  try {
    const p = JSON.parse(sessionStorage.getItem(PERCH_KEY));
    if (p && isFinite(p.fx) && isFinite(p.fy)) perch = p;
  } catch (_) {}
  let drag = null;
  let justDragged = false;
  const dragging = () => !!drag && drag.moved;

  // Layer
  const box = document.createElement("div");
  box.className = "mascot-box";
  box.hidden = true;
  box.innerHTML =
    `<div class="mascot-bubble"><svg class="mascot-bubble-art" aria-hidden="true"></svg>${
      isHome
        ? `<a class="mascot-bubble-text" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">`
        : '<span class="mascot-bubble-text">'
    }<span class="on"></span><span class="off">${BUBBLE_TEXT}</span>${isHome ? "</a>" : "</span>"}</div>` +
    '<canvas id="mascot" class="mascot" aria-hidden="true"></canvas>' +
    `<button class="mascot-hit" type="button" aria-label="Tux, o mascote do Linux. Clique para abrir ou fechar o terminal${
      isHome ? ". Arraste para mudar o lugar dele, duplo clique o devolve" : ""
    }"></button>`;
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

  // Material: 0 black, 1 white, 2 accent (beak and feet), 3 seasonal colour (the Santa hat)
  const ALBEDO = [0.16, 0.95, 0.62, 0.55];

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

  // Skins: a few extra shapes merged into the model, so the rasterizer draws them like the rest of him.
  // Some follow the calendar: "natal" (Dec 1 to Jan 6) is a Santa hat, "halloween" (Oct 20 to Nov 2) a witch hat,
  // "pascoa" (Easter week) bunny ears and "junina" (June) a straw hat. The others, "formatura" (graduation cap),
  // "formatura" (graduation cap), "coroa" (crown) and "festa" (party hat) are only worn on request ("tux skin <nome>" in the terminal).
  // "fone" (headphones) is worn on request and whenever Spotify says the owner is listening to something
  const SKIN_KEY = "mascot-skin";
  const MUSIC_KEY = "mascot-music";
  // The widget only reports on the home page, so the blog trusts the last report for this long
  const MUSIC_TTL = 5 * 60 * 1000;
  const SKINS = ["natal", "halloween", "pascoa", "junina", "formatura", "fone", "coroa", "festa"];

  // Easter Sunday for a year (the Gregorian computus)
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = h + l - 7 * m + 114;
    return new Date(y, Math.floor(n / 31) - 1, (n % 31) + 1);
  }

  function listening() {
    try {
      return Date.now() - Number(sessionStorage.getItem(MUSIC_KEY)) < MUSIC_TTL;
    } catch (_) {
      return false;
    }
  }

  function seasonSkin() {
    try {
      const forced = sessionStorage.getItem(SKIN_KEY);
      if (forced === "none" || SKINS.includes(forced)) return forced === "none" ? "" : forced;
    } catch (_) {}
    if (listening()) return "fone";
    const now = new Date();
    const m = now.getMonth();
    const d = now.getDate();
    if (m === 11 || (m === 0 && d <= 6)) return "natal";
    if ((m === 9 && d >= 20) || (m === 10 && d <= 2)) return "halloween";
    if (m === 5) return "junina";
    const today = new Date(now.getFullYear(), m, d);
    const sunday = easter(now.getFullYear());
    if (today >= new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() - 7) && today <= new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 1)) return "pascoa";
    return "";
  }

  function buildSkin(skin) {
    const pos = [], nor = [], mats = [], idx = [];

    // A grid over a parametric surface f(u, v) -> [x, y, z]. Normals come from its derivatives and point away from
    // center(u, v); each triangle is wound so its face normal agrees with them (the model's own convention)
    function surface(f, nu, nv, center, matOf) {
      const base = pos.length / 3;
      const e = 1e-3;
      for (let j = 0; j <= nv; j++) {
        for (let i = 0; i <= nu; i++) {
          const u = i / nu, v = j / nv;
          const p = f(u, v);
          const pu = f(Math.min(1, u + e), v), pu0 = f(Math.max(0, u - e), v);
          const pv = f(u, Math.min(1, v + e)), pv0 = f(u, Math.max(0, v - e));
          const du = [pu[0] - pu0[0], pu[1] - pu0[1], pu[2] - pu0[2]];
          const dv = [pv[0] - pv0[0], pv[1] - pv0[1], pv[2] - pv0[2]];
          let n = [du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]];
          const c = center(u, v);
          const out = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
          let len = Math.hypot(n[0], n[1], n[2]);
          // Degenerate spots (a cone's tip, a sphere's poles) take the outward direction instead
          if (len < 1e-9) {
            n = out;
            len = Math.hypot(n[0], n[1], n[2]) || 1;
          }
          const sign = n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0 ? -1 : 1;
          pos.push(p[0], p[1], p[2]);
          nor.push((sign * n[0]) / len, (sign * n[1]) / len, (sign * n[2]) / len);
          mats.push(matOf(p, u, v));
        }
      }
      const at = (i, j) => base + j * (nu + 1) + i;
      const tri = (a, b, c) => {
        const A = a * 3, B = b * 3, C = c * 3;
        const ux = pos[B] - pos[A], uy = pos[B + 1] - pos[A + 1], uz = pos[B + 2] - pos[A + 2];
        const vx = pos[C] - pos[A], vy = pos[C + 1] - pos[A + 1], vz = pos[C + 2] - pos[A + 2];
        const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
        const d = fx * (nor[A] + nor[B] + nor[C]) + fy * (nor[A + 1] + nor[B + 1] + nor[C + 1]) + fz * (nor[A + 2] + nor[B + 2] + nor[C + 2]);
        if (d >= 0) idx.push(a, b, c);
        else idx.push(a, c, b);
      };
      for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
          tri(at(i, j), at(i + 1, j), at(i + 1, j + 1));
          tri(at(i, j), at(i + 1, j + 1), at(i, j + 1));
        }
      }
    }

    const TAU = Math.PI * 2;
    // Shapes can pass through a transform "xf" (a tilt, a lean) before they are placed on his head
    const same = (p) => p;
    const matFn = (mat) => (typeof mat === "function" ? mat : () => mat);
    const sphere = (cx, cy, cz, rx, ry, rz, mat, xf = same) =>
      surface(
        (u, v) => {
          const a = u * TAU, b = v * Math.PI;
          return xf([cx + rx * Math.sin(b) * Math.cos(a), cy + ry * Math.cos(b), cz + rz * Math.sin(b) * Math.sin(a)]);
        },
        14, 8, () => xf([cx, cy, cz]), matFn(mat)
      );
    // A cone standing on y0, its tip h above
    const cone = (cx, y0, cz, r, h, mat, xf = same) =>
      surface(
        (u, t) => xf([cx + r * (1 - t) * Math.cos(u * TAU), y0 + h * t, cz + r * (1 - t) * Math.sin(u * TAU)]),
        14, 6, (u, t) => xf([cx, y0 + h * t, cz]), matFn(mat)
      );
    // A wall of a cylinder around the y axis
    const wall = (cx, y0, y1, cz, r, mat, xf = same) =>
      surface(
        (u, v) => xf([cx + r * Math.cos(u * TAU), y0 + (y1 - y0) * v, cz + r * Math.sin(u * TAU)]),
        20, 2, (u, v) => xf([cx, y0 + (y1 - y0) * v, cz]), matFn(mat)
      );
    // A ring: a circle of radius R around the y axis, swept by a tube of radius r
    const ring = (cx, cy, cz, R, r, mat, xf = same) =>
      surface(
        (u, v) => {
          const a = u * TAU, b = v * TAU;
          return xf([cx + (R + r * Math.cos(b)) * Math.cos(a), cy + r * Math.sin(b), cz + (R + r * Math.cos(b)) * Math.sin(a)]);
        },
        20, 6, (u) => xf([cx + R * Math.cos(u * TAU), cy, cz + R * Math.sin(u * TAU)]), matFn(mat)
      );
    // A box with rounded edges (a superquadric), for flat boards
    const slab = (cx, cy, cz, rx, ry, rz, mat, xf = same) => {
      const sp = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
      return surface(
        (u, v) => {
          const w = u * TAU - Math.PI, h = v * Math.PI - Math.PI / 2;
          return xf([cx + rx * sp(Math.cos(h), 0.3) * sp(Math.cos(w), 0.3), cy + ry * sp(Math.sin(h), 0.3), cz + rz * sp(Math.cos(h), 0.3) * sp(Math.sin(w), 0.3)]);
        },
        20, 10, () => xf([cx, cy, cz]), matFn(mat)
      );
    };
    // Rotations about a pivot, and a way to chain them
    const rotZ = (a, px, py) => ([x, y, z]) => [px + (x - px) * Math.cos(a) - (y - py) * Math.sin(a), py + (x - px) * Math.sin(a) + (y - py) * Math.cos(a), z];
    const rotX = (a, py, pz) => ([x, y, z]) => [x, py + (y - py) * Math.cos(a) - (z - pz) * Math.sin(a), pz + (y - py) * Math.sin(a) + (z - pz) * Math.cos(a)];
    const chain = (...fs) => (p) => fs.reduce((q, f) => f(q), p);

    if (skin === "natal") {
      // The hat sits tilted back on his head, above the eyes; its cone flops over to one side
      const tilt = -0.3;
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const frame = ([x, y, z]) => [x, 1.06 + y * ct - z * st, -0.02 + y * st + z * ct];
      const axis = (t) => [0.6 * t * t, 1.15 * t - 0.3 * t * t * t, -0.12 * t * t];
      const radius = (t) => 0.45 * Math.pow(1 - t, 0.8);
      surface(
        (u, t) => {
          const a = u * TAU, c = axis(t), r = radius(t);
          return frame([c[0] + r * Math.cos(a), c[1], c[2] + r * Math.sin(a)]);
        },
        16, 10, (u, t) => frame(axis(t)), () => 3
      );
      // White fur band around the brim
      surface(
        (u, v) => {
          const a = u * TAU, b = v * TAU, R = 0.45, r = 0.1;
          return frame([(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]);
        },
        20, 6, (u) => frame([0.45 * Math.cos(u * TAU), 0, 0.45 * Math.sin(u * TAU)]), () => 1
      );
      const tip = frame(axis(1));
      sphere(tip[0], tip[1], tip[2], 0.13, 0.13, 0.13, 1);
    } else if (skin === "halloween") {
      // A witch hat: a wide flat brim and a tall cone whose tip bends back
      const tilt = -0.22;
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const frame = ([x, y, z]) => [x, 1.1 + y * ct - z * st, -0.02 + y * st + z * ct];
      const axis = (t) => [0.08 * t * t, 1.2 * t - 0.25 * t * t * t, -0.45 * t * t * t];
      const radius = (t) => 0.4 * (1 - t);
      surface(
        (u, v) => {
          const a = u * TAU, b = v * Math.PI;
          return frame([0.8 * Math.sin(b) * Math.cos(a), 0.05 * Math.cos(b), 0.8 * Math.sin(b) * Math.sin(a)]);
        },
        24, 6, () => frame([0, 0, 0]), () => 0
      );
      surface(
        (u, t) => {
          const a = u * TAU, c = axis(t), r = radius(t);
          return frame([c[0] + r * Math.cos(a), c[1], c[2] + r * Math.sin(a)]);
        },
        16, 10, (u, t) => frame(axis(t)), () => 0
      );
    } else if (skin === "pascoa") {
      // Bunny ears: two long white ears with an accent lining, leaning out and a little back
      for (const side of [-1, 1]) {
        const xf = chain(rotZ(-side * 0.22, side * 0.2, 1.25), rotX(-0.12, 1.25, 0));
        sphere(side * 0.2, 1.68, 0, 0.11, 0.4, 0.06, 1, xf);
        sphere(side * 0.2, 1.66, 0.04, 0.06, 0.3, 0.03, 2, xf);
      }
    } else if (skin === "junina") {
      // Festa junina: a straw hat with a red band
      const xf = rotX(-0.14, 1.05, 0);
      sphere(0, 1.08, 0, 0.78, 0.05, 0.78, 2, xf);
      sphere(0, 1.1, 0, 0.42, 0.34, 0.42, 2, xf);
      ring(0, 1.16, 0, 0.42, 0.055, 3, xf);
    } else if (skin === "formatura") {
      // A graduation cap: a flat square board, turned a little, with a button and a tassel hanging on one side
      const xf = chain(rotX(-0.1, 1.3, 0), ((a) => ([x, y, z]) => [x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)])(0.5));
      slab(0, 1.36, 0, 0.62, 0.035, 0.62, 0, xf);
      sphere(0, 1.41, 0, 0.06, 0.04, 0.06, 2);
      const cord = [[0, 1.4, 0], [0.3, 1.39, 0.12], [0.55, 1.34, 0.22], [0.6, 1.12, 0.24]];
      surface(
        (u, v) => {
          const f = u * 3, i = Math.min(2, Math.floor(f)), k = f - i;
          const A = cord[i], B = cord[i + 1];
          const c = [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k];
          const b = v * TAU;
          return [c[0] + 0.03 * Math.cos(b), c[1] + 0.03 * Math.sin(b), c[2]];
        },
        12, 6, (u) => {
          const f = u * 3, i = Math.min(2, Math.floor(f)), k = f - i;
          const A = cord[i], B = cord[i + 1];
          return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2])  * k];
        }, () => 2
      );
      sphere(0.6, 1.02, 0.24, 0.07, 0.14, 0.07, 2);
    } else if (skin === "fone") {
      // Headphones: a band over his head and a cup over each ear
      surface(
        (u, v) => {
          const A = Math.PI * u, b = v * TAU;
          const c = [0.47 * Math.cos(A), 0.72 + 0.66 * Math.sin(A)];
          let nx = Math.cos(A) / 0.47, ny = Math.sin(A) / 0.66;
          const n = Math.hypot(nx, ny);
          nx /= n;
          ny /= n;
          return [c[0] + 0.055 * (Math.cos(b) * nx), c[1] + 0.055 * (Math.cos(b) * ny), -0.02 + 0.055 * Math.sin(b)];
        },
        24, 6, (u) => [0.47 * Math.cos(Math.PI * u), 0.72 + 0.66 * Math.sin(Math.PI * u), -0.02], () => 1
      );
      for (const side of [-1, 1]) sphere(side * 0.46, 0.72, -0.02, 0.11, 0.2, 0.2, 1);
    } else if (skin === "coroa") {
      // A crown: a gold band with five points, each ending in a white bead
      const xf = rotX(-0.1, 1.02, 0);
      wall(0, 1.02, 1.16, 0, 0.43, 2, xf);
      ring(0, 1.02, 0, 0.43, 0.025, 2, xf);
      ring(0, 1.16, 0, 0.43, 0.025, 2, xf);
      for (let k = 0; k < 5; k++) {
        const a = 0.5 + (k * TAU) / 5;
        const x = 0.43 * Math.cos(a), z = 0.43 * Math.sin(a);
        cone(x, 1.16, z, 0.12, 0.34, 2, xf);
        sphere(x, 1.54, z, 0.065, 0.065, 0.065, 1, xf);
      }
    } else if (skin === "festa") {
      // A party hat: a striped cone leaning to one side, with a white pompom
      const frame = chain(rotZ(-0.28, 0, 1.06), rotX(-0.15, 1.06, 0));
      cone(0, 1.06, 0, 0.36, 0.95, (p, u, t) => (Math.floor(t * 7) % 2 ? 1 : 3), frame);
      const tip = frame([0, 2.01, 0]);
      sphere(tip[0], tip[1], tip[2], 0.1, 0.1, 0.1, 1);
    }
    return { pos, nor, mats, idx };
  }

  function withSkin(base, skin) {
    if (!skin) return base;
    const extra = buildSkin(skin);
    const V = base.V + extra.pos.length / 3;
    const T = base.T + extra.idx.length / 3;
    const pos = new Float32Array(V * 3);
    const nor = new Float32Array(V * 3);
    const mats = new Uint8Array(V);
    const idx = new Uint16Array(T * 3);
    pos.set(base.pos);
    pos.set(extra.pos, base.V * 3);
    nor.set(base.nor);
    nor.set(extra.nor, base.V * 3);
    mats.set(base.mats);
    mats.set(extra.mats, base.V);
    idx.set(base.idx);
    idx.set(extra.idx.map((i) => i + base.V), base.T * 3);
    return {
      V, T, pos, nor, mats, idx, skin,
      sx: new Float32Array(V), sy: new Float32Array(V), sz: new Float32Array(V), lum: new Float32Array(V),
    };
  }

  // Size and screen position
  let vw = 0, vh = 0, W = 0, H = 0;

  // During the party the real size grows (so the ASCII stays sharp); only the transition between sizes is a CSS scale
  let boosted = false;
  let baseW = 0;

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    // Sized so that he fits under the hero text
    const hMax = Math.min(0.27 * vh, vh / 2 - 170, 260);
    baseW = Math.max(110, Math.min((hMax * 300) / 340, vw * 0.42));
    const baseH = (baseW * 340) / 300;
    const boost = boosted ? Math.max(1, Math.min((vh * 0.76) / baseH, (vw * 0.6) / baseW)) : 1;
    W = baseW * boost;
    H = baseH * boost;
    box.style.width = W + "px";
    box.style.height = H + "px";
    if (spot) spot.style.height = Math.round(baseH + 134 + 44) + "px";
  }

  const heroActive = () => hero.classList.contains("active");
  // Only the home hero lets him be moved, and not on short screens (a phone on its side), where he is not shown at all
  const canDrag = () => isHome && heroActive() && vh >= 560;

  function follow() {
    if (!spot) return { mode: "away", x: (vw - W) / 2, y: vh + 40 };
    const r = spot.getBoundingClientRect();
    return { mode: "follow", x: r.left + (r.width - W) / 2, y: r.bottom - H - CREDIT_GAP - 20 };
  }

  function targetFor() {
    if (partyStart >= 0 && !partyLeaving) return { mode: "fixed", x: (vw - W) / 2, y: (vh - H) / 2 + vh * 0.07 };
    if (dragging()) return { mode: "fixed", x: drag.x, y: drag.y };
    if (!boosted) return homeTarget();

    // Walking home while still big: aim where the small box will be, shifted so the two boxes share a centre
    // (the CSS scale shrinks him around it), so nothing slides when the real size comes back
    const bigW = W;
    const bigH = H;
    W = baseW;
    H = (baseW * 340) / 300;
    const t = homeTarget();
    t.x -= (bigW - W) / 2;
    t.y -= (bigH - H) / 2;
    W = bigW;
    H = bigH;
    return t;
  }

  function homeTarget() {
    if (perch && canDrag()) return { mode: "fixed", x: perch.fx * Math.max(0, vw - W), y: perch.fy * Math.max(0, vh - H) };
    if (isHome) {
      if (heroActive()) {
        if (vh < 560) return { mode: "away", x: (vw - W) / 2, y: vh + 40 };
        if (vw < 700) {
          // On phones he sits halfway between the hint and the Spotify widget
          const hint = hero.querySelector(".hint");
          const widget = document.querySelector(".spotify-widget");
          if (hint && widget) {
            const top = hint.getBoundingClientRect().bottom;
            const bottom = widget.getBoundingClientRect().top;
            return { mode: "fixed", x: (vw - W) / 2, y: Math.max(top, (top + bottom - H) / 2) };
          }
        }
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
    // The stage changed (or the screen turned) while he was held: let go
    if (drag && !canDrag()) endDrag();
    box.classList.toggle("is-draggable", canDrag());
    const t = targetFor();
    if (t.mode !== mode) {
      mode = t.mode;
      modeSince = now;
    }
    const k = 1 - Math.exp(-dt / 140);
    // At the end of a page he sticks to the page, so scrolling does not make him lag behind
    if (dragging() || (mode === "follow" && now - modeSince > 1400)) {
      pos.x = t.x;
      pos.y = t.y;
    } else {
      pos.x += (t.x - pos.x) * k;
      pos.y += (t.y - pos.y) * k;
    }
    // The translate property, not transform: the CSS scale applies after it, so it scales around the box and leaves its position alone
    // Whole pixels: a fractional offset smears the characters and the cloud's edges
    box.style.translate = `${Math.round(pos.x)}px ${Math.round(pos.y)}px`;
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
    // Centred by hand: translate(-50%, -50%) lands on half pixels when the text has an odd size
    bubbleText.style.left = Math.round((bw - tw) / 2) + "px";
    bubbleText.style.top = Math.round((bh - th) / 2) + "px";
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

  // Which side of his head the cloud is on, and what was last drawn (the art is only rebuilt when it changes)
  let bubbleSide = 1;
  let drawnKey = "";

  function placeBubble() {
    if (!bubble || (!bw && !sizeBubble())) return;
    const a = bw / 2, b = bh / 2;
    // Where his head is inside the layer
    const hx = W / 2, hy = H * 0.2, rh = H * 0.15;
    const ang = isHome ? ANGLE : (72 * Math.PI) / 180;
    const re = 1 / Math.hypot(Math.cos(ang) / a, Math.sin(ang) / b);
    const dist = re + rh + TRAIL;

    // Some slack before it goes back to the right, so it does not flip back and forth while he walks
    const room = vw - 8 - (pos.x + hx + dist * Math.cos(ang) + a);
    if (room < 0) bubbleSide = -1;
    else if (room > 48) bubbleSide = 1;
    let cx = hx + bubbleSide * dist * Math.cos(ang);
    const cy = hy - dist * Math.sin(ang);

    // Keep it inside the screen
    const absLeft = pos.x + cx - a;
    let maxLeft = vw - 8 - bw;
    const main = !isHome && mode === "fixed" && document.querySelector(".blog-main");
    if (main) maxLeft = Math.min(maxLeft, main.getBoundingClientRect().left - 16 - bw);
    cx += clamp(absLeft, 8, Math.max(8, maxLeft)) - absLeft;

    bubble.style.left = Math.round(cx - a) + "px";
    bubble.style.top = Math.round(cy - b) + "px";
    const key = `${bw},${bh},${Math.round(hx - cx)},${Math.round(hy - cy)}`;
    if (key !== drawnKey) {
      drawnKey = key;
      drawBubble(hx - cx, hy - cy);
    }
  }

  function refitBubble() {
    if (!bubble) return;
    bw = 0;
    if (pos && bubble.classList.contains("is-on")) placeBubble();
  }

  // A short comment that takes the bubble over for a while (sleeping, reading milestones, copying code)
  let speech = null;
  let shownText = null;
  // When a new comment replaces the one on screen (swapAt), and when the cloud last left (leftAt)
  let swapAt = 0;
  let leftAt = -1e9;

  function say(text, ms = 4500) {
    speech = { text, until: performance.now() + ms };
  }

  // One comment can wait for the current one to end (a greeting and a song can arrive together)
  let nextSpeech = null;
  function sayNext(text, ms) {
    if (speech) nextSpeech = { text, ms };
    else say(text, ms);
  }

  // His own comments stay off the home menu, where the bubble belongs to the repository link
  const chatty = () => !isHome || heroActive();

  function updateBubble(now) {
    if (!bubble) return;
    if (speech && now >= speech.until) {
      speech = null;
      if (nextSpeech) {
        say(nextSpeech.text, nextSpeech.ms);
        nextSpeech = null;
      }
    }
    const text = speech ? speech.text : partyStart >= 0 ? "" : BUBBLE_TEXT;
    const rel = parseFloat(bubble.style.top);
    const top = pos.y + (isNaN(rel) ? -90 : rel);
    const placed = speech ? true : isHome ? mode === "follow" && now - modeSince > 900 : isIndex && now - modeSince > 1800;
    const want = !!text && placed && !leaving && !dragging() && onScreen && top > 8 && fitsBeside();
    const isOn = bubble.classList.contains("is-on");

    // New text: the cloud is sized again, and the home link only makes sense for his own text
    const applyText = () => {
      shownText = text;
      typedAt = now;
      typedLen = -1;
      bubbleOn.textContent = "";
      bubbleOff.textContent = text;
      bw = 0;
      if (isHome) {
        if (speech) bubbleText.removeAttribute("href");
        else bubbleText.setAttribute("href", REPO_URL);
      }
    };

    if (text !== shownText) {
      if (!isOn) {
        // Hidden: swap at once when the cloud is about to show, else once the last exit has finished
        if (want || now - leftAt > 320) applyText();
      } else if (want) {
        // Visible and staying: the cloud dips, the words and the shape change unseen, and it comes back
        if (!swapAt) {
          swapAt = now;
          if (!reduceMotion.matches) bubble.classList.add("is-swapping");
        }
        if (now - swapAt >= (reduceMotion.matches ? 0 : 170)) {
          applyText();
          placeBubble();
          bubble.classList.remove("is-swapping");
          swapAt = 0;
        }
      }
      // Leaving: the old words stay until the cloud is gone, so it never shows empty
    }

    if (want && !isOn) {
      placeBubble();
      bubble.classList.add("is-on");
      typedAt = now;
      typedLen = -1;
    } else if (!want && isOn) {
      bubble.classList.remove("is-on", "is-swapping");
      swapAt = 0;
      leftAt = now;
    }
    if (!want) return;
    // He keeps moving while the cloud is up, so it is placed again every frame
    placeBubble();
    if (swapAt) return;

    // His own text is typed only the first time: opening the contact form moves the page, and the bubble must not start over
    const total = text.length;
    const n = (!speech && typingDone) || reduceMotion.matches ? total : clamp(Math.floor((now - typedAt - 250) / 38), 0, total);
    if (!speech && n === total) typingDone = true;
    if (n !== typedLen) {
      typedLen = n;
      bubbleOn.textContent = text.slice(0, n);
      bubbleOff.textContent = text.slice(n);
    }
  }

  // Canvas layout and raster buffers
  let dpr = 1, cssW = 0, cssH = 0, cols = 0, rows = 0, cellW = 0, cellH = 0, SW = 0, SH = 0;
  let zbuf, lbuf, mbuf, hbuf;

  function layout() {
    // Layout size, not getBoundingClientRect: the party's CSS scale must not shrink the bitmap
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = w;
    cssH = h;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    // The party's big Tux gets more characters rather than bigger ones: about 140 columns instead of 72
    cellW = Math.max(4, Math.round(cssW / PAD / (boosted ? 140 : 72)));
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
      style.getPropertyValue("--mascot-red").trim() || textColor,
    ];
    const theme = canvas.getAttribute("data-theme") || document.documentElement.getAttribute("data-theme") || "light";
    // The party happens on a darkened screen, so he is drawn light on dark whatever the theme
    const isDark = theme === "dark" || partyLook;

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
      const albedo = isDark && m === 0 ? (partyLook ? 0.7 : 0.3) : ALBEDO[m];
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
        let count = 0, sum = 0, m0 = 0, m1 = 0, m2 = 0, m3 = 0;
        for (let v = 0; v < SS; v++) {
          for (let u = 0; u < SS; u++) {
            const p = (j * SS + v) * SW + i * SS + u;
            if (!hbuf[p]) continue;
            count++;
            sum += lbuf[p];
            const m = mbuf[p];
            if (m === 0) m0++; else if (m === 1) m1++; else if (m === 2) m2++; else m3++;
          }
        }
        if (count < 2) continue;

        let material = m1 >= m0 && m1 >= m2 ? 1 : m2 > m0 ? 2 : 0;
        if (m3 > m0 && m3 > m1 && m3 > m2) material = 3;
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
  // The party: Tux goes to the middle of the screen and dances to a 126 bpm beat, while party.js runs the lights
  const PARTY_MS = 8000;
  const BEAT_MS = 476;
  // The way out overlaps the lights fading: he shrinks and walks home over the last 900 ms, and the party look
  // (light on dark) is dropped 400 ms before the end, while the screen is still half dark
  const LEAVE_MS = 900;
  const LOOK_END_MS = 400;
  let partyLeaving = false;
  let partyLook = false;
  // On the darkened screen he keeps to his own colours, only lighter: pale body, white belly, yellow beak and feet
  function partyColors(on) {
    if (!on) {
      canvas.style.color = "";
      canvas.style.removeProperty("--mascot-white");
      canvas.style.removeProperty("--mascot-accent");
      return;
    }
    canvas.style.color = "#d6d9e8";
    canvas.style.setProperty("--mascot-white", "#ffffff");
    canvas.style.setProperty("--mascot-accent", "#ffd21f");
  }
  let partyStart = -1;

  // After a while without any input he dozes off (head down, "zzz"), and wakes with a spin when you come back.
  // Late at night (midnight to 6 am, local time) he is sleepier
  const lateNight = () => new Date().getHours() < 6;
  const idleMs = () => (lateNight() ? 20000 : 45000);
  let lastActive = performance.now();
  let sleeping = false;

  function wake() {
    lastActive = performance.now();
    if (!sleeping) return;
    sleeping = false;
    if (!reduceMotion.matches) spin(performance.now());
    say(lateNight() ? "hm? tava cochilando... que horas são? o.O" : "opa, voltou amigao? o.O", 2800);
  }

  // A greeting by time of day, once per visit
  const GREET_KEY = "mascot-greeted";
  function greet() {
    try {
      if (sessionStorage.getItem(GREET_KEY)) return;
      sessionStorage.setItem(GREET_KEY, "1");
    } catch (_) {}
    if (!chatty()) return;
    const h = new Date().getHours();
    const text =
      h < 6 ? "madrugada, hein? eu também não durmo :p" :
      h < 12 ? "bom dia! o café já tá passado?" :
      h < 18 ? "boa tarde! bora fuçar o site?" :
      "boa noite! fica à vontade :)";
    sayNext(text, 4000);
  }

  // The Spotify widget on the home page (script.js) reports what is playing: he bobs to the music and comments on new songs
  let music = null;
  window.addEventListener("spotify:update", (e) => {
    const d = e.detail || {};
    const key = d.playing ? d.artist + " - " + d.title : "";
    const isNew = key && (!music || music.key !== key);
    music = key ? { key } : null;
    const wasListening = listening();
    try {
      if (key) sessionStorage.setItem(MUSIC_KEY, String(Date.now()));
      else sessionStorage.removeItem(MUSIC_KEY);
    } catch (_) {}
    if (baseModel && wasListening !== !!key) model = withSkin(baseModel, seasonSkin());
    if (!isNew || sleeping || partyStart >= 0 || !chatty()) return;
    const title = d.title.length > 22 ? d.title.slice(0, 21).trimEnd() + "..." : d.title;
    sayNext("ouvindo " + title.toLowerCase() + "? boa escolha :)", 4000);
  });

  // Capture phase, so keys typed in the terminal (which stops them) still count
  for (const type of ["pointermove", "pointerdown", "keydown", "wheel", "scroll", "touchstart"]) {
    window.addEventListener(type, wake, { passive: true, capture: true });
  }
  document.addEventListener("visibilitychange", wake);

  if (isPost && !document.body.matches(".page-now, .page-uses")) {
    const said = { half: false, end: false };
    window.addEventListener(
      "scroll",
      () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max < window.innerHeight * 2) return;
        const p = window.scrollY / max;
        if (!said.half && p >= 0.5) {
          said.half = true;
          say("metade do post, segura aí :)");
        } else if (!said.end && p >= 0.985) {
          said.end = true;
          say("acabou! bora pro próximo?");
        }
      },
      { passive: true }
    );
    document.addEventListener("click", (e) => {
      if (e.target.closest && e.target.closest(".copy-btn")) say("copiou! confere antes de rodar ;)", 3500);
    });
  }

  // Konami code easter egg (also reachable with a "mascot:party" event)
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

  function growTux() {
    const oldW = W;
    const oldH = H;
    boosted = true;
    measure();
    pos.x -= (W - oldW) / 2;
    pos.y -= (H - oldH) / 2;
    box.style.scale = String(oldW / W);
    const anim = box.animate([{ scale: oldW / W }, { scale: 1 }], { duration: 900, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.15)", fill: "both" });
    anim.onfinish = () => {
      anim.cancel();
      box.style.scale = "";
    };
  }

  function shrinkTux() {
    box.style.scale = "1";
    const anim = box.animate([{ scale: 1 }, { scale: baseW / W }], { duration: LEAVE_MS, easing: "ease-in-out", fill: "forwards" });
    anim.onfinish = () => {
      const oldW = W;
      const oldH = H;
      boosted = false;
      measure();
      pos.x += (oldW - W) / 2;
      pos.y += (oldH - H) / 2;
      anim.cancel();
      box.style.scale = "";
    };
  }

  function party() {
    if (reduceMotion.matches || partyStart >= 0 || !pos || box.hidden) return;
    partyStart = performance.now();
    partyLeaving = false;
    partyLook = true;
    partyColors(true);
    lastActive = partyStart;
    sleeping = false;
    confetti();
    growTux();
    window.dispatchEvent(new CustomEvent("party:start", { detail: { ms: PARTY_MS } }));
  }

  window.addEventListener("mascot:party", party);

  // Esc or the "sair" button: jump to the start of the way out, so he shrinks back right away
  window.addEventListener("party:stop", () => {
    if (partyStart >= 0 && !partyLeaving) partyStart = Math.min(partyStart, performance.now() - (PARTY_MS - LEAVE_MS));
  });
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

  // The spin plays first, then the terminal pops out of him (terminal.js listens for this event)
  let toggleTimer = 0;
  let toggleFired = false;
  function openTerminal() {
    clearTimeout(toggleTimer);
    toggleFired = false;
    toggleTimer = setTimeout(() => {
      toggleTimer = 0;
      toggleFired = true;
      window.dispatchEvent(new Event("terminal:toggle"));
    }, reduceMotion.matches ? 0 : 350);
  }

  // Back to his own spot after a drag (double click, or "tux reset" in the terminal). Returns whether he had been moved
  function resetPerch() {
    const moved = !!perch;
    perch = null;
    try {
      sessionStorage.removeItem(PERCH_KEY);
    } catch (_) {}
    if (moved && canDrag()) say("de volta pro meu cantinho :)", 2500);
    return moved;
  }

  window.addEventListener("mascot:reset", (e) => {
    const moved = resetPerch();
    if (e.detail) e.detail.moved = moved;
  });

  // Drag him anywhere: a press that moves a few pixels picks him up, a plain press still opens the terminal
  hit.addEventListener("pointerdown", (e) => {
    justDragged = false;
    // A second finger is ignored while one is already dragging
    if (drag || !pos || partyStart >= 0 || !canDrag() || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag = { touch: e.pointerType !== "mouse", id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, x: pos.x, y: pos.y, moved: false };
    try {
      hit.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  hit.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < (drag.touch ? DRAG_PX.touch : DRAG_PX.mouse)) return;
      drag.moved = true;
      box.classList.add("is-dragging");
    }
    drag.x = clamp(drag.ox + dx, 0, Math.max(0, vw - W));
    drag.y = clamp(drag.oy + dy, 0, Math.max(0, vh - H));
  });

  function endDrag() {
    if (!drag) return;
    if (drag.moved) {
      justDragged = true;
      perch = { fx: drag.x / Math.max(1, vw - W), fy: drag.y / Math.max(1, vh - H) };
      try {
        sessionStorage.setItem(PERCH_KEY, JSON.stringify(perch));
      } catch (_) {}
    }
    drag = null;
    box.classList.remove("is-dragging");
  }
  const release = (e) => {
    if (drag && e.pointerId === drag.id) endDrag();
  };
  hit.addEventListener("pointerup", release);
  hit.addEventListener("pointercancel", release);
  hit.addEventListener("lostpointercapture", release);
  // Switching apps or tabs mid-drag must not leave him stuck to a finger that is gone
  window.addEventListener("blur", endDrag);
  document.addEventListener("visibilitychange", () => document.hidden && endDrag());

  hit.addEventListener("click", (e) => {
    e.stopPropagation();
    if (justDragged) {
      justDragged = false;
      return;
    }
    // A double click puts him back and leaves the terminal as it was: the first click's toggle is cancelled, or undone if it already ran
    if (partyStart >= 0) return;
    if (e.detail === 2) {
      if (toggleTimer) {
        clearTimeout(toggleTimer);
        toggleTimer = 0;
      } else if (toggleFired) {
        window.dispatchEvent(new Event("terminal:toggle"));
      }
      toggleFired = false;
      resetPerch();
      return;
    }
    // Keyboard presses are handled on keydown, and a third click of a burst is ignored
    if (e.detail === 1) {
      if (!reduceMotion.matches) spin(performance.now());
      openTerminal();
    }
  });
  hit.addEventListener("keydown", (e) => {
    if (partyStart >= 0) return;
    if (e.key === "Enter" || e.key === " ") {
      // The page also uses these keys to leave the hero
      e.preventDefault();
      e.stopPropagation();
      if (!reduceMotion.matches) spin(performance.now());
      openTerminal();
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
    if (!sleeping && onScreen && !document.hidden && now - lastActive > idleMs()) {
      sleeping = true;
      say("zzz...", 1e9);
    }
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

      if (sleeping) {
        targetYaw = -0.15;
        targetPitch = 0.38 + 0.03 * Math.sin(t * 1.1);
      } else if (pointer && now - lastMove < 4000) {
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
        const t = now - partyStart;
        if (!partyLeaving && t >= PARTY_MS - LEAVE_MS) {
          partyLeaving = true;
          shrinkTux();
        }
        if (partyLook && t >= PARTY_MS - LOOK_END_MS) {
          partyLook = false;
          partyColors(false);
        }
        if (t >= PARTY_MS) {
          partyStart = -1;
          partyLeaving = false;
          say("festinha boa slk", 3500);
        } else {
          const k = clamp(t / 900, 0, 1) * clamp((PARTY_MS - t) / LEAVE_MS, 0, 1);
          const beat = t / BEAT_MS;
          lift = Math.max(lift, Math.abs(Math.sin(Math.PI * (beat % 1))) * 0.22 * k);
          spinYaw += Math.sin((beat * Math.PI) / 2) * 0.7 * k;
          const turn = beat % 8;
          if (turn >= 6 && beat > 2) spinYaw += ease((turn - 6) / 2) * Math.PI * 2;
          const roll = beat % 16;
          if (roll >= 10 && roll < 12 && beat > 2) flipPitch += ease((roll - 10) / 2) * Math.PI * 2;
        }
      }

      // A small bob to the music, about 120 bpm
      if (music && !sleeping && partyStart < 0) lift = Math.max(lift, Math.abs(Math.sin((now / 500) * Math.PI)) * 0.06);

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

  let baseModel = null;
  // "tux skin" in the terminal previews a skin for the rest of the visit ("auto" goes back to the calendar)
  window.addEventListener("mascot:skin", (e) => {
    const want = e.detail && e.detail.skin;
    try {
      if (want === "auto") sessionStorage.removeItem(SKIN_KEY);
      else sessionStorage.setItem(SKIN_KEY, want || "none");
    } catch (_) {}
    if (baseModel) model = withSkin(baseModel, seasonSkin());
    if (e.detail) e.detail.skin = seasonSkin();
  });

  loadModel()
    .then((m) => {
      baseModel = m;
      model = withSkin(m, seasonSkin());

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
      setTimeout(greet, saved ? 600 : 1600);
    })
    .catch(() => box.remove());

  requestAnimationFrame(frame);
})();
