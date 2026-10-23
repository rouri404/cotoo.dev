const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');

const POST_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const postOgCache = new Map();
let cachedFont = null;

function loadFont() {
  if (cachedFont) return cachedFont;
  const candidates = [
    path.join(process.cwd(), 'assets', 'fonts', 'Tiny5-Regular.ttf'),
    path.join(__dirname, '..', 'assets', 'fonts', 'Tiny5-Regular.ttf'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        cachedFont = fs.readFileSync(p);
        return cachedFont;
      }
    } catch (_) {}
  }
  return null;
}

function getBlogDir() {
  const candidates = [
    path.join(process.cwd(), 'blog'),
    path.join(__dirname, '..', 'blog'),
    path.join(__dirname, 'blog'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return path.join(process.cwd(), 'blog');
}

function parseFrontMatter(raw) {
  const match = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
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
  if (!meta.title || !meta.description || !meta.date) return null;
  if (meta.tags) {
    meta.tags = meta.tags
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  } else {
    meta.tags = [];
  }
  return { meta, body: match[2] };
}

function resolvePost(cleanSlug) {
  const blogDir = getBlogDir();
  if (!fs.existsSync(blogDir)) return null;

  const files = fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !f.toLowerCase().startsWith('readme'));

  for (const file of files) {
    try {
      const fullPath = path.join(blogDir, file);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const parsed = parseFrontMatter(raw);
      if (!parsed) continue;
      const baseName = file.replace(/\.md$/, '');
      const postSlug = (parsed.meta.slug || baseName).trim().replace(/^\/+|\/+$/g, '');
      if (postSlug === cleanSlug || baseName === cleanSlug) {
        const words = parsed.body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
        const hash = crypto.createHash('md5').update(raw).digest('hex');
        return {
          meta: parsed.meta,
          readingMinutes: Math.max(1, Math.round(words / 200)),
          hash,
        };
      }
    } catch (_) {}
  }
  return null;
}

const formatShortDate = (iso) =>
  new Date(`${iso}T12:00:00-03:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });

async function renderPostOg(post, fontData) {
  const { meta, readingMinutes } = post;
  const title = meta.title;
  const desc = meta.description.length > 160 ? meta.description.slice(0, 157) + '...' : meta.description;
  const titleSize = title.length > 52 ? 48 : title.length > 36 ? 56 : 64;
  const tags = (meta.tags || []).slice(0, 5);

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#121212',
          color: '#8fbc8b',
          width: 1200,
          height: 630,
          fontFamily: 'Tiny5',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: 1056,
                height: 510,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: 1056,
                      borderBottom: '3px solid rgba(143, 188, 139, 0.35)',
                      paddingBottom: '20px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: 28, letterSpacing: '0.04em' },
                          children: 'cotoo.dev / blog',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: 24, opacity: 0.7 },
                          children: `${formatShortDate(meta.date)} · ${readingMinutes} min de leitura`,
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      width: 1056,
                      padding: '20px 0',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: titleSize,
                            lineHeight: 1.15,
                            marginBottom: '22px',
                            color: '#8fbc8b',
                          },
                          children: title,
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 28,
                            lineHeight: 1.38,
                            opacity: 0.78,
                          },
                          children: desc,
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: 1056,
                      borderTop: '3px solid rgba(143, 188, 139, 0.35)',
                      paddingTop: '20px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', flexDirection: 'row', gap: '12px' },
                          children: tags.map((t) => ({
                            type: 'div',
                            props: {
                              style: {
                                fontSize: 22,
                                padding: '6px 14px',
                                border: '2px solid #8fbc8b',
                              },
                              children: `#${t}`,
                            },
                          })),
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: 26, opacity: 0.85 },
                          children: 'Gabriel Couto',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Tiny5', data: fontData, weight: 400, style: 'normal' }],
    },
  );

  const resvg = new Resvg(svg, {
    background: '#121212',
    fitTo: { mode: 'width', value: 1200 },
  });
  return resvg.render().asPng();
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(405).send('Method not allowed.');
    }

    const query = req.query || {};
    const { slug, name, msg } = query;

    let fontData = loadFont();
    if (!fontData) {
      const fontRes = await fetch('https://raw.githubusercontent.com/Gissio/font_Tiny5/main/fonts/ttf/Tiny5-Regular.ttf');
      cachedFont = await fontRes.arrayBuffer();
      fontData = cachedFont;
    }

    if (slug !== undefined) {
      const cleanSlug = typeof slug === 'string' ? slug.trim().replace(/^\/+|\/+$/g, '') : '';
      if (!cleanSlug || cleanSlug.length > 100 || !POST_SLUG_RE.test(cleanSlug)) {
        return res.redirect(302, '/');
      }
      const post = resolvePost(cleanSlug);
      if (!post) {
        return res.redirect(302, '/');
      }
      const cacheKey = `${cleanSlug}:${post.hash}`;
      let pngBuffer = postOgCache.get(cacheKey);
      if (!pngBuffer) {
        pngBuffer = await renderPostOg(post, fontData);
        postOgCache.set(cacheKey, pngBuffer);
      }
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
      return res.send(pngBuffer);
    }

    const isValid = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
    if (!isValid(name, 100) || !isValid(msg, 80)) {
      return res.redirect(302, '/');
    }

    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#121212',
            color: '#8fbc8b',
            width: '100%',
            height: '100%',
            padding: '60px',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  borderTop: '4px solid #8fbc8b',
                  borderBottom: '4px solid #8fbc8b',
                  padding: '40px 0',
                  justifyContent: 'center'
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: 32, fontFamily: 'Tiny5', opacity: 0.6, marginBottom: '20px' },
                      children: '// recebido'
                    }
                  },
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: 90, fontFamily: 'Tiny5', marginBottom: '30px' },
                      children: `Olá, ${name}`
                    }
                  },
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: 40, fontFamily: 'Tiny5', opacity: 0.9, marginBottom: '60px' },
                      children: 'Sua mensagem pousou na minha caixa de entrada!'
                    }
                  },
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', flexDirection: 'row', borderLeft: '4px solid #8fbc8b', paddingLeft: '20px' },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', flexDirection: 'column' },
                            children: [
                              {
                                type: 'div',
                                props: { style: { fontSize: 36, fontFamily: 'Tiny5', marginBottom: '10px' }, children: 'Aviso do Sistema' }
                              },
                              {
                                type: 'div',
                                props: { style: { fontSize: 32, fontFamily: 'Tiny5', opacity: 0.6 }, children: `"${msg}"` }
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      {
        width: 1200,
        height: 600,
        fonts: [
          {
            name: 'Tiny5',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    );

    const resvg = new Resvg(svg, {
      background: '#121212',
      fitTo: {
        mode: 'width',
        value: 1200
      }
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(pngBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: ${error.message}\nStack: ${error.stack}`);
  }
};
