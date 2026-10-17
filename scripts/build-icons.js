// Builds the PWA icons in assets/img/icons/ from the 10x10 pixel favicon: node scripts/build-icons.js
// Each pixel is scaled with nearest neighbour, so the edges stay sharp at every size
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "assets/img/favicon.svg");
const OUT = path.join(ROOT, "assets/img/icons");
const BG = "#8EBA8E";

async function icon(size, file, glyphCells) {
  // The 10x10 grid scaled by a whole number, centred on the favicon's own background
  const cell = Math.floor(size / glyphCells);
  const grid = await sharp(SRC, { density: 72 }).resize(10, 10, { kernel: "nearest" }).png().toBuffer();
  const scaled = await sharp(grid).resize(cell * 10, cell * 10, { kernel: "nearest" }).png().toBuffer();
  const offset = Math.round((size - cell * 10) / 2);
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: scaled, left: offset, top: offset }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(OUT, file));
}

(async () => {
  await icon(180, "apple-touch-icon.png", 10);
  await icon(192, "icon-192.png", 10);
  await icon(512, "icon-512.png", 10);
  // Maskable: the glyph keeps to the safe zone, the middle 80%
  await icon(512, "icon-maskable-512.png", 16);
  console.log("icons written to", path.relative(ROOT, OUT));
})();
