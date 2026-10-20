import fs from 'fs';
import path from 'path';
import { HOME_EN } from './_home-en.js';

// /en/: the home page in English. It is index.html with the pairs from _home-en.js applied, so the page itself has a
// single source; the scripts get their English text from assets/js/i18n-en.js, loaded before everything else
const SITE = 'https://www.cotoo.dev';
let cached = null;

function build() {
  let html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const missing = [];
  // Longest first, so a short key never breaks a longer one that contains it
  for (const [pt, en] of [...HOME_EN].sort((a, b) => b[0].length - a[0].length)) {
    if (!html.includes(pt)) missing.push(pt);
    else html = html.split(pt).join(en);
  }
  if (missing.length) console.warn(`en: ${missing.length} Portuguese strings no longer match index.html`);

  const page = [
    ['<html lang="pt-br">', '<html lang="en">'],
    ['<meta property="og:url" content="https://www.cotoo.dev/" />', `<meta property="og:url" content="${SITE}/en/" />`],
    ['<meta property="og:locale" content="pt_BR" />', '<meta property="og:locale" content="en_US" />\n    <meta property="og:locale:alternate" content="pt_BR" />'],
    ['<link rel="canonical" href="https://www.cotoo.dev/" />', `<link rel="canonical" href="${SITE}/en/" />`],
    ['<a href="/en/" class="nav-lang" hreflang="en" lang="en" title="English version">en</a>', '<a href="/" class="nav-lang" hreflang="pt-BR" lang="pt-BR" title="Versão em português">pt</a>'],
    ['<script src="assets/js/i18n.js"></script>', '<script src="/assets/js/i18n-en.js"></script>\n    <script src="/assets/js/i18n.js"></script>'],
  ];
  for (const [from, to] of page) {
    if (!html.includes(from)) missing.push(from);
    html = html.replace(from, to);
  }
  // Relative asset paths would resolve under /en/
  html = html.replace(/(src|href)="assets\//g, '$1="/assets/');
  return { html, missing };
}

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).send('Method not allowed.');
  }
  if (!cached || process.env.VERCEL_ENV === 'development') cached = build();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(cached.html);
}

export { build };
