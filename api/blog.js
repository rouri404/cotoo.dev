const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

let MarkedClass = null;
async function getMarkedClass() {
  if (MarkedClass) return MarkedClass;
  const markedModule = await import('marked');
  MarkedClass = markedModule.Marked;
  return MarkedClass;
}

const SITE = 'https://www.cotoo.dev';
const AUTHOR = 'Gabriel Couto';
const TTL_SECONDS = 15 * 24 * 60 * 60; // 15 days (15 * 24 * 60 * 60)

const memCache = new Map();

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Highlight comments in code blocks to provide crisp retro syntax contrast
function highlightCode(rawText) {
  const lines = rawText.split('\n');
  return lines
    .map((line) => {
      const commentIdx = line.search(/(?<!["'\\])#/);
      if (commentIdx !== -1) {
        const codePart = escapeHtml(line.slice(0, commentIdx));
        const commentPart = escapeHtml(line.slice(commentIdx));
        return `${codePart}<span class="code-comment">${commentPart}</span>`;
      }
      return escapeHtml(line);
    })
    .join('\n');
}

// Diagram placeholder: the source stays in the HTML (SEO, no-JS fallback) and mermaid-block.js renders it
function renderMermaidBlock(source) {
  const title = (source.match(/^\s*%%\s*title:\s*(.+)$/m) || [])[1];
  const code = source.replace(/^\s*%%\s*title:.*$/m, '').trim();
  const label = title ? title.trim() : 'diagrama';
  return `<figure class="mermaid-block" data-state="idle">
  <div class="mermaid-header">
    <span class="mermaid-label">${escapeHtml(label)}</span>
    <button class="mermaid-toggle" type="button" aria-pressed="false" title="Alternar entre diagrama e código">código</button>
  </div>
  <div class="mermaid-stage">
    <div class="mermaid-canvas" role="img" aria-label="${escapeHtml(label)}" aria-live="polite"></div>
    <pre class="mermaid-source"><code class="language-mermaid">${escapeHtml(code)}</code></pre>
  </div>
</figure>\n`;
}

const ALERT_CONFIG = {
  NOTE: {
    label: 'Nota',
    class: 'callout-note',
    icon: '<svg class="callout-icon" viewBox="0 0 12 12" width="16" height="16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="1" width="6" height="1"/><rect x="1" y="3" width="1" height="6"/><rect x="10" y="3" width="1" height="6"/><rect x="3" y="10" width="6" height="1"/><rect x="2" y="2" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="2" y="9" width="1" height="1"/><rect x="9" y="9" width="1" height="1"/><rect x="5" y="3" width="2" height="2"/><rect x="5" y="6" width="2" height="3"/></svg>',
  },
  TIP: {
    label: 'Dica',
    class: 'callout-tip',
    icon: '<svg class="callout-icon" viewBox="0 0 12 12" width="16" height="16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="1" width="4" height="1"/><rect x="3" y="2" width="6" height="4"/><rect x="4" y="6" width="4" height="2"/><rect x="4" y="9" width="4" height="1"/><rect x="5" y="10" width="2" height="1"/><rect x="1" y="3" width="1" height="2"/><rect x="10" y="3" width="1" height="2"/><rect x="5" y="0" width="2" height="1"/></svg>',
  },
  IMPORTANT: {
    label: 'Importante',
    class: 'callout-important',
    icon: '<svg class="callout-icon" viewBox="0 0 12 12" width="16" height="16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="1" width="4" height="1"/><rect x="2" y="2" width="2" height="1"/><rect x="8" y="2" width="2" height="1"/><rect x="1" y="3" width="1" height="6"/><rect x="10" y="3" width="1" height="6"/><rect x="2" y="9" width="2" height="1"/><rect x="8" y="9" width="2" height="1"/><rect x="4" y="10" width="4" height="1"/><rect x="5" y="3" width="2" height="4"/><rect x="5" y="8" width="2" height="1"/></svg>',
  },
  WARNING: {
    label: 'Aviso',
    class: 'callout-warning',
    icon: '<svg class="callout-icon" viewBox="0 0 12 12" width="16" height="16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><rect x="5" y="1" width="2" height="1"/><rect x="4" y="2" width="1" height="2"/><rect x="7" y="2" width="1" height="2"/><rect x="3" y="4" width="1" height="2"/><rect x="8" y="4" width="1" height="2"/><rect x="2" y="6" width="1" height="2"/><rect x="9" y="6" width="1" height="2"/><rect x="1" y="8" width="1" height="2"/><rect x="10" y="8" width="1" height="2"/><rect x="0" y="10" width="12" height="2"/><rect x="5" y="4" width="2" height="3"/><rect x="5" y="8" width="2" height="1"/></svg>',
  },
  CAUTION: {
    label: 'Cuidado',
    class: 'callout-caution',
    icon: '<svg class="callout-icon" viewBox="0 0 12 12" width="16" height="16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="1" width="4" height="1"/><rect x="2" y="2" width="2" height="1"/><rect x="8" y="2" width="2" height="1"/><rect x="1" y="4" width="1" height="4"/><rect x="10" y="4" width="1" height="4"/><rect x="2" y="9" width="2" height="1"/><rect x="8" y="9" width="2" height="1"/><rect x="4" y="10" width="4" height="1"/><rect x="4" y="4" width="1" height="1"/><rect x="7" y="4" width="1" height="1"/><rect x="5" y="5" width="2" height="2"/><rect x="4" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/></svg>',
  },
};

function parseFrontMatter(raw) {
  const match = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Missing front matter');
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    }
  }
  for (const key of ['title', 'description', 'date']) {
    if (!meta[key]) throw new Error(`Missing front matter field: ${key}`);
  }
  if (meta.tags) {
    if (meta.tags.startsWith('[') && meta.tags.endsWith(']')) {
      meta.tags = meta.tags
        .slice(1, -1)
        .split(',')
        .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      meta.tags = meta.tags
        .split(',')
        .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    }
  } else {
    meta.tags = [];
  }
  return { meta, body: match[2] };
}

function createSlugger() {
  const seen = new Map();
  return (text) => {
    const clean = text.replace(/^\d+(\.\d+)*\s+/, '');
    const base = clean
      .toLowerCase()
      .replace(/[`*_]/g, '')
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s/g, '-');
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count ? `${base}-${count}` : base;
  };
}

async function renderMarkdownWith(body) {
  const Marked = await getMarkedClass();
  const slug = createSlugger();
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, text, depth }) {
        const level = Math.max(depth, 2);
        return `<h${level} id="${escapeHtml(slug(text))}">${this.parser.parseInline(tokens)}</h${level}>\n`;
      },
      link({ href, title, tokens }) {
        const external = /^https?:\/\//.test(href);
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(href)}"${titleAttr}${attrs}>${this.parser.parseInline(tokens)}</a>`;
      },
      table(token) {
        const header = token.header.map((cell, i) => this.tablecell({ ...cell, header: true, align: token.align[i] })).join('');
        const rows = token.rows
          .map((row) => `<tr>${row.map((cell, i) => this.tablecell({ ...cell, header: false, align: token.align[i] })).join('')}</tr>`)
          .join('');
        return `<div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
      code(token) {
        const lang = (token.lang || 'terminal').trim().split(/\s+/)[0];
        if (lang === 'mermaid') return renderMermaidBlock(token.text);
        const highlighted = highlightCode(token.text);
        return `<div class="code-block">
  <div class="code-header">
    <span class="code-lang">${escapeHtml(lang)}</span>
    <button class="copy-btn" type="button" aria-label="Copiar código" title="Copiar comandos">
      <svg class="copy-icon" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="1" width="6" height="1"/><rect x="4" y="1" width="1" height="7"/><rect x="9" y="1" width="1" height="7"/><rect x="4" y="7" width="6" height="1"/><rect x="2" y="4" width="6" height="1"/><rect x="2" y="4" width="1" height="7"/><rect x="7" y="4" width="1" height="7"/><rect x="2" y="10" width="6" height="1"/></svg>
      <svg class="check-icon" viewBox="0 0 12 12" width="12" height="12" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><rect x="9" y="2" width="2" height="2"/><rect x="7" y="4" width="2" height="2"/><rect x="5" y="6" width="2" height="2"/><rect x="3" y="8" width="2" height="2"/><rect x="2" y="6" width="2" height="2"/></svg>
      <span class="copy-text">copiar</span>
    </button>
  </div>
  <pre><code class="language-${escapeHtml(lang)}">${highlighted}</code></pre>
</div>\n`;
      },
      blockquote(token) {
        const first = token.tokens?.[0];
        if (first && first.type === 'paragraph') {
          const match = first.text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n|\s+|$)/i);
          if (match) {
            const type = match[1].toUpperCase();
            const conf = ALERT_CONFIG[type];
            const tokens = token.tokens.map((t) => ({ ...t }));
            const firstPara = { ...tokens[0] };
            tokens[0] = firstPara;

            const remainder = firstPara.text.slice(match[0].length);
            if (remainder.trim().length === 0) {
              tokens.shift();
              if (tokens[0]?.type === 'space') tokens.shift();
            } else {
              firstPara.text = remainder;
              firstPara.raw = remainder;
              if (firstPara.tokens && firstPara.tokens[0]) {
                firstPara.tokens = firstPara.tokens.map((t) => ({ ...t }));
                const t0 = { ...firstPara.tokens[0] };
                firstPara.tokens[0] = t0;
                t0.text = t0.text.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n|\s+|$)/i, '');
                t0.raw = t0.raw.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n|\s+|$)/i, '');
              }
            }

            const bodyHtml = this.parser.parse(tokens);
            return `<aside class="callout ${conf.class}">\n  <div class="callout-header">\n    ${conf.icon}\n    <span class="callout-title">${conf.label}</span>\n  </div>\n  <div class="callout-body">\n    ${bodyHtml}  </div>\n</aside>\n`;
          }
        }
        return `<blockquote>\n${this.parser.parse(token.tokens)}</blockquote>\n`;
      },
    },
  });
  return marked.parse(body);
}

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00-03:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

const xmlEscape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

function renderRss(posts) {
  const items = posts
    .map(({ meta, slug }) => {
      const url = `${SITE}/blog/${slug}/`;
      const categories = meta.tags.map((t) => `      <category>${xmlEscape(t)}</category>`).join('\n');
      return `    <item>
      <title>${xmlEscape(meta.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${meta.date}T12:00:00-03:00`).toUTCString()}</pubDate>
      <description>${xmlEscape(meta.description)}</description>${categories ? `\n${categories}` : ''}
    </item>`;
    })
    .join('\n');
  const lastBuild = posts[0] ? new Date(`${posts[0].meta.date}T12:00:00-03:00`).toUTCString() : new Date().toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog | Gabriel Couto</title>
    <link>${SITE}/blog/</link>
    <description>Guias e anotações de Gabriel Couto sobre back-end, infraestrutura e sistemas.</description>
    <language>pt-BR</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

function layout({ title, description, canonical, bodyClass, content, jsonLd, ogType, extraScripts = '' }) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#121212" id="meta-theme-color" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="author" content="${AUTHOR}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" type="application/rss+xml" title="Blog | Gabriel Couto" href="${SITE}/blog/rss.xml" />

    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="Gabriel Couto | cotoo.dev" />
    <meta property="og:image" content="${SITE}/assets/img/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${SITE}/assets/img/og-image.png" />

    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>
    <link rel="icon" type="image/png" href="/assets/img/favicon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Tiny5&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/assets/css/blog.css" />
    <link rel="stylesheet" href="/assets/css/mascot.css" />
    <script src="/assets/js/blog.js"></script>
    <script src="/assets/js/mascot.js" defer></script>${extraScripts}
  </head>
  <body class="${bodyClass}">
    <canvas id="pixel-transition"></canvas>
    <div class="blog-bar-backdrop" aria-hidden="true"></div>
    <header class="blog-bar">
      <nav class="blog-nav-brand">
        <a class="blog-brand-link" href="/" title="Voltar para cotoo.dev">&lt; cotoo.dev</a>
        <span class="blog-nav-slash">/</span>
        <a class="blog-brand-link" href="/blog/" title="Ir para o início do blog">blog</a>
      </nav>
      <div class="blog-bar-actions">
        <button class="font-toggle" id="fontToggle" type="button" title="Alternar fonte (Pixel / Leitura)" aria-label="Alternar fonte">Aa</button>
        <button class="theme-toggle" id="themeToggle" type="button" title="Alternar tema" aria-label="Alternar tema"></button>
      </div>
    </header>
${content}
  </body>
</html>
`;
}

function renderPostHtml(post) {
  const { meta, html, slug, readingMinutes } = post;
  const url = `${SITE}/blog/${slug}/`;
  const tags = meta.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const content = `    <main class="blog-main">
      <nav class="crumbs" aria-label="Navegação"><a href="/blog/">blog</a> / ${escapeHtml(slug)}</nav>
      <article class="post">
        <header class="post-header">
          <h1 id="${escapeHtml(createSlugger()(meta.title))}">${escapeHtml(meta.title)}</h1>
          <p class="post-meta"><time datetime="${meta.date}">${formatDate(meta.date)}</time> · ${readingMinutes} min de leitura</p>
          <p class="post-tags">${tags}</p>
        </header>
        <div class="prose">
${html}
        </div>
      </article>
    </main>`;
  return layout({
    title: `${meta.title} | Gabriel Couto`,
    description: meta.description,
    canonical: url,
    bodyClass: 'page-post',
    ogType: 'article',
    content,
    extraScripts: '\n    <script src="/assets/js/post-toc.js" defer></script>\n    <script src="/assets/js/post-motion.js" defer></script>' + (html.includes('class="mermaid-block"') ? '\n    <script src="/assets/js/mermaid-block.js" defer></script>' : ''),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: meta.title,
      description: meta.description,
      inLanguage: 'pt-BR',
      datePublished: meta.date,
      dateModified: meta.updated || meta.date,
      keywords: meta.tags.join(', '),
      mainEntityOfPage: url,
      image: `${SITE}/assets/img/og-image.png`,
      author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/` },
      publisher: { '@type': 'Person', name: AUTHOR, url: `${SITE}/` },
    },
  });
}

function renderIndexHtml(posts) {
  const items = posts
    .map(
      ({ meta, slug, readingMinutes }) => `        <li data-search="${escapeHtml([meta.title, meta.description, ...meta.tags].join(' '))}">
          <a class="post-card" href="/blog/${slug}/">
            <span class="post-card-title">${escapeHtml(meta.title)}</span>
            <span class="post-card-desc">${escapeHtml(meta.description)}</span>
            <span class="post-card-meta"><time datetime="${meta.date}">${formatDate(meta.date)}</time> · ${readingMinutes} min de leitura</span>
          </a>
        </li>`,
    )
    .join('\n');
  const content = `    <main class="blog-main">
      <header class="post-header">
        <h1>blog</h1>
        <p class="post-meta">Guias e anotações sobre back-end, infraestrutura e sistemas.</p>
      </header>
      <div class="post-search" hidden>
        <label class="post-search-label" for="postSearch">// buscar</label>
        <input class="post-search-input" id="postSearch" type="search" placeholder="título, tag ou assunto" autocomplete="off" spellcheck="false" />
      </div>
      <p class="post-search-empty" id="postSearchEmpty" hidden>nenhum post encontrado</p>
      <ul class="post-list">
${items}
      </ul>
    </main>`;
  const description = 'Guias e anotações de Gabriel Couto sobre back-end, infraestrutura e sistemas.';
  return layout({
    title: 'Blog | Gabriel Couto',
    description,
    canonical: `${SITE}/blog/`,
    bodyClass: 'page-index',
    ogType: 'website',
    content,
    extraScripts: '\n    <script src="/assets/js/post-search.js" defer></script>',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog | Gabriel Couto',
      description,
      url: `${SITE}/blog/`,
      inLanguage: 'pt-BR',
      author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/` },
      blogPost: posts.map(({ meta, slug }) => ({
        '@type': 'BlogPosting',
        headline: meta.title,
        url: `${SITE}/blog/${slug}/`,
        datePublished: meta.date,
      })),
    },
  });
}

function render404Html() {
  const content = `    <main class="blog-main">
      <header class="post-header">
        <h1>404</h1>
        <p class="post-meta">Publicação não encontrada.</p>
      </header>
      <div class="prose">
        <p>O artigo que você está procurando não existe ou foi removido.</p>
        <p><a href="/blog/">&lt; Voltar para a listagem do blog</a></p>
      </div>
    </main>`;
  return layout({
    title: '404 Não Encontrado | Blog',
    description: 'Publicação não encontrada no blog.',
    canonical: `${SITE}/blog/`,
    bodyClass: 'page-404',
    ogType: 'website',
    content,
    jsonLd: {},
  });
}

function getFileHashAndMtime(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return { exists: true, mtime: stat.mtimeMs, hash, raw: content.toString('utf8') };
  } catch (_) {
    return { exists: false, mtime: 0, hash: '', raw: '' };
  }
}

function getBlogDir() {
  const candidates = [
    path.join(process.cwd(), 'blog'),
    path.join(__dirname, '..', 'blog'),
    path.join(__dirname, 'blog'),
    path.resolve('blog'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return path.join(process.cwd(), 'blog');
}

function getBlogDirSignature() {
  const blogDir = getBlogDir();
  if (!fs.existsSync(blogDir)) return { signature: '', files: [] };
  try {
    const files = fs
      .readdirSync(blogDir)
      .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !f.toLowerCase().startsWith('readme'))
      .sort();

    let sig = '';
    for (const f of files) {
      try {
        const stat = fs.statSync(path.join(blogDir, f));
        sig += `${f}:${stat.mtimeMs}:${stat.size};`;
      } catch (_) {}
    }
    const signature = crypto.createHash('md5').update(sig).digest('hex');
    return { signature, files };
  } catch (_) {
    return { signature: '', files: [] };
  }
}

// Read markdown files dynamically from the blog folder
function getLocalPosts() {
  const blogDir = getBlogDir();
  if (!fs.existsSync(blogDir)) return [];

  const files = fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !f.toLowerCase().startsWith('readme'));
  const posts = [];

  for (const file of files) {
    try {
      const fullPath = path.join(blogDir, file);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const { meta, body } = parseFrontMatter(raw);
      const slug = (meta.slug || file.replace(/\.md$/, '')).trim().replace(/^\/+|\/+$/g, '');
      const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
      const stat = fs.statSync(fullPath);
      const hash = crypto.createHash('md5').update(raw).digest('hex');
      posts.push({
        meta,
        slug,
        body,
        readingMinutes: Math.max(1, Math.round(words / 200)),
        filePath: fullPath,
        mtime: stat.mtimeMs,
        hash,
      });
    } catch (err) {
      console.error(`Error reading ${file}:`, err);
    }
  }

  posts.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
  return posts;
}

// Safe isolated Redis client: never touches cotoo:visits
let redisClient = null;
let redisInitialized = false;

async function getRedisClient() {
  if (redisInitialized) return redisClient;
  redisInitialized = true;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;
  if (!url || !token) return null;

  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch (err) {
    console.error('Redis init error:', err);
    return null;
  }
}

// Resilient Redis fetch with 400ms timeout race to prevent slow local/remote networks from hanging
async function safeRedisGet(redis, key) {
  if (!redis) return null;
  try {
    return await Promise.race([
      redis.get(key),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 400)),
    ]);
  } catch (_) {
    return null;
  }
}

// Resilient Redis write with 400ms timeout race to guarantee persistence in serverless environments
async function safeRedisSet(redis, key, value, ttlSeconds = TTL_SECONDS) {
  if (!redis) return;
  try {
    await Promise.race([
      redis.set(key, value, { ex: ttlSeconds }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis set timeout')), 400)),
    ]);
  } catch (err) {
    console.error(`Redis set error for ${key}:`, err.message);
  }
}

// Resolve blog post file path by slug or filename
function resolvePostFilePath(cleanSlug) {
  const blogDir = getBlogDir();
  if (!fs.existsSync(blogDir)) return null;

  // 1. Exact filename match: blog/${cleanSlug}.md
  const directPath = path.join(blogDir, `${cleanSlug}.md`);
  if (fs.existsSync(directPath)) return directPath;

  // 2. Scan blog/*.md files for frontmatter slug match or base filename match
  const files = fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !f.toLowerCase().startsWith('readme'));

  for (const file of files) {
    try {
      const fullPath = path.join(blogDir, file);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const { meta } = parseFrontMatter(raw);
      const postSlug = (meta.slug || file.replace(/\.md$/, '')).trim().replace(/^\/+|\/+$/g, '');
      const baseName = file.replace(/\.md$/, '');
      if (postSlug === cleanSlug || baseName === cleanSlug) {
        return fullPath;
      }
    } catch (_) {}
  }

  return null;
}

async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const query = req.query || {};
    let slug = query.slug;
    let format = query.format;
    let refresh = query.refresh;

    if (!slug && req.url) {
      try {
        const parsedUrl = new URL(req.url, 'http://localhost');
        slug = slug || parsedUrl.searchParams.get('slug');
        format = format || parsedUrl.searchParams.get('format');
        refresh = refresh || parsedUrl.searchParams.get('refresh');
      } catch (_) {}
    }

    const isJson = format === 'json' || (req.headers && req.headers['accept'] && req.headers['accept'].includes('application/json') && !req.headers['accept'].includes('text/html'));
    const forceRefresh = refresh === '1' || refresh === 'true';

    if (format === 'rss') {
      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).send(renderRss(getLocalPosts()));
    }

    const redis = await getRedisClient();
    const TEMPLATE_VERSION = 'v17';

    if (slug) {
      const cleanSlug = String(slug).trim().replace(/^\/+|\/+$/g, '');
      const cacheKey = `cotoo:blog:post:${cleanSlug}`;
      const filePath = resolvePostFilePath(cleanSlug);
      const fileInfo = filePath ? getFileHashAndMtime(filePath) : { exists: false, mtime: 0, hash: '', raw: '' };

      // Tier 1: Fast in-memory cache check (<0.1ms)
      if (!forceRefresh && fileInfo.exists) {
        const memCached = memCache.get(cleanSlug);
        if (memCached && memCached.hash === fileInfo.hash && memCached.version === TEMPLATE_VERSION) {
          if (isJson) {
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
            return res.status(200).json(memCached.post);
          }
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
          res.setHeader('X-Cache', 'HIT-MEM');
          return res.status(200).send(memCached.html);
        }
      }

      let redisCached = null;
      if (redis && !forceRefresh) {
        redisCached = await safeRedisGet(redis, cacheKey);
        if (redisCached && typeof redisCached === 'object' && redisCached.html) {
          const isUpToDate = fileInfo.exists ? (redisCached.hash === fileInfo.hash && redisCached.version === TEMPLATE_VERSION) : true;
          if (isUpToDate) {
            memCache.set(cleanSlug, redisCached);
            if (isJson) {
              res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
              return res.status(200).json(redisCached.post);
            }
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
            res.setHeader('X-Cache', 'HIT-REDIS');
            return res.status(200).send(redisCached.html);
          }
        }
      }

      if (!fileInfo.exists) {
        if (isJson) return res.status(404).json({ error: 'Post not found' });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(404).send(render404Html());
      }

      const { meta, body } = parseFrontMatter(fileInfo.raw);
      const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
      const htmlContent = await renderMarkdownWith(body);
      const post = {
        meta,
        slug: cleanSlug,
        body,
        readingMinutes: Math.max(1, Math.round(words / 200)),
        html: htmlContent,
      };
      const postHtml = renderPostHtml(post);

      const cacheEntry = {
        version: TEMPLATE_VERSION,
        hash: fileInfo.hash,
        mtime: fileInfo.mtime,
        html: postHtml,
        post: {
          slug: cleanSlug,
          meta: post.meta,
          readingMinutes: post.readingMinutes,
        },
        updatedAt: new Date().toISOString(),
      };

      memCache.set(cleanSlug, cacheEntry);

      if (redis) {
        await safeRedisSet(redis, cacheKey, cacheEntry);
      }

      if (isJson) {
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).json(cacheEntry.post);
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      res.setHeader('X-Cache', redisCached ? 'REFRESHED' : 'MISS');
      return res.status(200).send(postHtml);
    }

    const indexCacheKey = 'cotoo:blog:index';
    const latestCacheKey = 'cotoo:blog:latest';
    const dirSig = getBlogDirSignature();

    if (!forceRefresh) {
      const memIndex = memCache.get('__index__');
      if (memIndex && memIndex.signature === dirSig.signature && memIndex.version === TEMPLATE_VERSION) {
        if (isJson) {
          res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
          return res.status(200).json(memIndex.json);
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('X-Cache', 'HIT-MEM');
        return res.status(200).send(memIndex.html);
      }
    }

    let redisIndex = null;
    if (redis && !forceRefresh) {
      redisIndex = await safeRedisGet(redis, indexCacheKey);
      if (redisIndex && typeof redisIndex === 'object' && redisIndex.signature === dirSig.signature && redisIndex.version === TEMPLATE_VERSION && redisIndex.html) {
        memCache.set('__index__', redisIndex);
        if (isJson) {
          res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
          return res.status(200).json(redisIndex.json);
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('X-Cache', 'HIT-REDIS');
        return res.status(200).send(redisIndex.html);
      }
    }

    const posts = getLocalPosts();
    const indexHtml = renderIndexHtml(posts);
    const indexJson = {
      posts: posts.map((p) => ({
        slug: p.slug,
        meta: p.meta,
        readingMinutes: p.readingMinutes,
      })),
      latest: posts[0] || null,
    };

    const indexEntry = {
      version: TEMPLATE_VERSION,
      signature: dirSig.signature,
      html: indexHtml,
      json: indexJson,
      updatedAt: new Date().toISOString(),
    };

    memCache.set('__index__', indexEntry);

    if (redis) {
      await Promise.all([
        safeRedisSet(redis, indexCacheKey, indexEntry),
        posts[0] ? safeRedisSet(redis, latestCacheKey, posts[0].meta) : Promise.resolve(),
      ]);
    }

    if (isJson) {
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json(indexJson);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Cache', redisIndex ? 'REFRESHED' : 'MISS');
    return res.status(200).send(indexHtml);
  } catch (err) {
    console.error('Blog handler unexpected error:', err);
    if (!res.headersSent) {
      const isJson = (req.query && req.query.format === 'json') || (req.headers && req.headers['accept'] && req.headers['accept'].includes('application/json'));
      if (isJson) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(500).send('<!doctype html><html><head><meta charset="utf-8"><title>Erro no Blog</title></head><body style="background:#121212;color:#8fbc8b;font-family:sans-serif;padding:2rem;"><h1 style="font-family:monospace;">500 - Erro no Blog</h1><p>Ocorreu uma falha temporária ao carregar a página. Tente novamente em instantes.</p><p><a href="/" style="color:#8fbc8b;">&lt; Voltar para a home</a></p></body></html>');
    }
  }
}

module.exports = handler;
module.exports.default = handler;
