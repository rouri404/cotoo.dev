// Lists the Portuguese strings from api/_home-en.js that no longer appear in index.html (their part of /en/ stays in
// Portuguese until the key is updated) and the tr() keys in the scripts that have no English entry in assets/js/i18n-en.js.
//   node scripts/check-en.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const pairs = new Function(read("api/_home-en.js").replace("export const HOME_EN =", "return"))();
const html = read("index.html");
const stale = pairs.filter(([pt]) => !html.includes(pt));

global.window = {};
new Function("window", read("assets/js/i18n-en.js"))(global.window);
const en = window.I18N_EN;
// Keys that are code or names, not text
const SKIP = new Set(["/home/tux", "Gabriel Couto", "MMMMMMMMMM", "rss: "]);
const untranslated = new Set();
for (const file of ["script.js", "terminal.js", "mascot.js", "party.js", "heatmap.js"]) {
  const src = read("assets/js/" + file);
  // tr("..."), and both branches of tr(cond ? "..." : "...")
  for (const m of src.matchAll(/tr\((?:[^()"]*\?\s*)?"((?:[^"\\]|\\.)*)"(?:\s*:\s*"((?:[^"\\]|\\.)*)")?/g)) {
    for (const raw of m.slice(1)) {
      if (raw === undefined) continue;
      const key = JSON.parse('"' + raw + '"');
      if (!(key in en) && !SKIP.has(key)) untranslated.add(file + ": " + key);
    }
  }
}

for (const [pt] of stale) console.log("index.html no longer has: " + pt.slice(0, 100));
for (const item of untranslated) console.log("no English for " + item);
console.log(stale.length + untranslated.size ? `\n${stale.length} stale page keys, ${untranslated.size} untranslated script keys` : "ok: every key matches and has a translation");
process.exitCode = stale.length + untranslated.size ? 1 : 0;
