// Builds assets/models/tux.bin from the Sketchfab GLB: bakes the node transform,
// normalizes the size, merges nearby vertices (grid clustering) and quantizes.
//
// Usage: node scripts/build-tux-model.js [grid=96]
//
// Binary layout (little-endian):
//   "TUX1", u32 vertexCount, u32 triangleCount, f32 extent
//   i16[3*V] positions (value / 32767 * extent), i8[3*V] normals (value / 127),
//   padding to an even length, u8[V] materials (0 black, 1 white, 2 orange),
//   padding to an even length, u16[3*T] indices
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "models", "tux.glb");
const OUT = path.join(__dirname, "..", "assets", "models", "tux.bin");
const GRID = Number(process.argv[2]) || 96;
const HEIGHT = 2.6;

const glb = fs.readFileSync(SRC);
let off = 12;
const chunks = [];
while (off < glb.length) {
  const len = glb.readUInt32LE(off);
  chunks.push({ type: glb.toString("ascii", off + 4, off + 8), start: off + 8, len });
  off += 8 + len;
}
const json = JSON.parse(glb.toString("utf8", chunks[0].start, chunks[0].start + chunks[0].len));
const bin = glb.subarray(chunks[1].start, chunks[1].start + chunks[1].len);

function read(index, Type) {
  const a = json.accessors[index];
  const view = json.bufferViews[a.bufferView];
  const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const start = bin.byteOffset + (view.byteOffset || 0) + (a.byteOffset || 0);
  const copy = bin.buffer.slice(start, start + a.count * comps * Type.BYTES_PER_ELEMENT);
  return new Type(copy);
}

// World matrix of each mesh node (column-major, as glTF stores it)
const parent = new Map();
json.nodes.forEach((n, i) => (n.children || []).forEach((c) => parent.set(c, i)));

function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}

function local(n) {
  if (n.matrix) return n.matrix;
  if (n.translation || n.rotation || n.scale) throw new Error("TRS nodes are not handled");
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function world(i) {
  let m = local(json.nodes[i]);
  for (let p = parent.get(i); p !== undefined; p = parent.get(p)) m = mul(local(json.nodes[p]), m);
  return m;
}

const parts = [];
json.nodes.forEach((n, ni) => {
  if (n.mesh === undefined) return;
  const m = world(ni);
  const prim = json.meshes[n.mesh].primitives[0];
  const pos = read(prim.attributes.POSITION, Float32Array);
  const nor = read(prim.attributes.NORMAL, Float32Array);
  const idx = read(prim.indices, Uint32Array);
  const count = pos.length / 3;
  const P = new Float64Array(count * 3);
  const N = new Float64Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    P[i * 3] = m[0] * x + m[4] * y + m[8] * z + m[12];
    P[i * 3 + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    P[i * 3 + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    const nx = nor[i * 3], ny = nor[i * 3 + 1], nz = nor[i * 3 + 2];
    N[i * 3] = m[0] * nx + m[4] * ny + m[8] * nz;
    N[i * 3 + 1] = m[1] * nx + m[5] * ny + m[9] * nz;
    N[i * 3 + 2] = m[2] * nx + m[6] * ny + m[10] * nz;
  }
  parts.push({ material: prim.material, P, N, idx, count });
});

// Normalize: center the bounding box and scale to HEIGHT
const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
for (const p of parts) for (let i = 0; i < p.count; i++) for (let k = 0; k < 3; k++) {
  lo[k] = Math.min(lo[k], p.P[i * 3 + k]);
  hi[k] = Math.max(hi[k], p.P[i * 3 + k]);
}
const center = lo.map((v, k) => (v + hi[k]) / 2);
const scale = HEIGHT / (hi[1] - lo[1]);
for (const p of parts) for (let i = 0; i < p.count; i++) for (let k = 0; k < 3; k++) p.P[i * 3 + k] = (p.P[i * 3 + k] - center[k]) * scale;

// Cluster vertices per mesh so the colours keep their own surfaces
const cell = HEIGHT / GRID;
const outP = [], outN = [], outM = [], outI = [];
for (const p of parts) {
  const clusters = new Map();
  const remap = new Int32Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const key = [0, 1, 2].map((k) => Math.floor(p.P[i * 3 + k] / cell)).join(",");
    let c = clusters.get(key);
    if (!c) {
      c = { id: outM.length, n: 0, p: [0, 0, 0], nn: [0, 0, 0] };
      clusters.set(key, c);
      outM.push(p.material);
      outP.push(null);
      outN.push(null);
    }
    c.n++;
    for (let k = 0; k < 3; k++) { c.p[k] += p.P[i * 3 + k]; c.nn[k] += p.N[i * 3 + k]; }
    remap[i] = c.id;
  }
  for (const c of clusters.values()) {
    outP[c.id] = c.p.map((v) => v / c.n);
    const l = Math.hypot(...c.nn) || 1;
    outN[c.id] = c.nn.map((v) => v / l);
  }
  const seen = new Set();
  for (let t = 0; t < p.idx.length; t += 3) {
    const a = remap[p.idx[t]], b = remap[p.idx[t + 1]], c = remap[p.idx[t + 2]];
    if (a === b || b === c || a === c) continue;
    const key = [a, b, c].sort((x, y) => x - y).join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    outI.push(a, b, c);
  }
}

const V = outM.length, T = outI.length / 3;
if (V > 65535) throw new Error("Too many vertices for 16-bit indices");
const extent = Math.max(...outP.flat().map(Math.abs)) * 1.0001;

const even = (n) => n + (n % 2);
const total = 16 + V * 6 + even(V * 3) + even(V) + T * 6;
const buf = Buffer.alloc(total);
buf.write("TUX1", 0, "ascii");
buf.writeUInt32LE(V, 4);
buf.writeUInt32LE(T, 8);
buf.writeFloatLE(extent, 12);
let o = 16;
for (const p of outP) for (let k = 0; k < 3; k++) { buf.writeInt16LE(Math.round((p[k] / extent) * 32767), o); o += 2; }
const nStart = o;
for (const n of outN) for (let k = 0; k < 3; k++) buf.writeInt8(Math.round(n[k] * 127), o++);
o = nStart + even(V * 3);
for (const m of outM) buf.writeUInt8(m, o++);
o = nStart + even(V * 3) + even(V);
for (const i of outI) { buf.writeUInt16LE(i, o); o += 2; }

fs.writeFileSync(OUT, buf);
console.log(`grid ${GRID}: ${V} vertices, ${T} triangles, ${(total / 1024).toFixed(1)} kB -> ${path.relative(process.cwd(), OUT)}`);
