---
title: colophon
description: How this site is built, from the code to the hosting.
date: 2026-10-20
---

## Foundation

- **No framework:** plain HTML, CSS and JavaScript. There is no React, bundler or build step; the browser gets the files as they sit in the repository.
- **Hosting:** Vercel. Static pages are served straight from the edge, and a few serverless functions under `/api` handle the dynamic bits.
- **Open source:** the whole repository lives on [GitHub](https://github.com/rouri404/cotoo.dev).

## Visuals

- **Fonts:** Tiny5, a pixel font, and Agave Nerd Font in the terminal. Both are served by the site itself as small subsets.
- **Theme transition:** the theme button triggers a dither wave (a 4×4 Bayer matrix on a `<canvas>`) sweeping from the top-right corner. Each element flips its colors the moment the wave reaches it rather than all at once.
- **Project hover:** the letters of each project name flip in 3D one after another, and turn back in reverse order when the cursor leaves.

## Tux

- **3D ASCII:** the penguin is a real 3D model drawn with characters on a `<canvas>` by a hand-written rasterizer. He follows the mouse, can be dragged around on the hero and spins when you click him.
- **Accessories:** a Santa hat at Christmas, a witch hat on Halloween, bunny ears at Easter, headphones whenever I am listening to music and a nightcap late at night.
- **Terminal:** clicking Tux, or pressing `/`, opens a terminal with commands like `projects`, `grep`, `music`, `neofetch` and even `snake`.

## Live data

- **Spotify:** the home widget shows what I am listening to right now, backed by a function that refreshes the Spotify API token.
- **GitHub:** the contribution calendar and the latest commit come from the GitHub APIs, cached briefly at the edge.
- **Visits and reads:** counters in Redis (Upstash), one for the site and one per post.
- **Project status:** the cards check whether the projects' live sites are up.

## Blog

- **Markdown:** each post is a `.md` file in the repository. A serverless function converts it to HTML on demand and caches the result in Redis and at the edge, so a post is only re-rendered when its file changes.
- **Extras:** a table of contents with sticky section headings, syntax-highlighted code blocks, Mermaid diagrams, an RSS feed, dynamic Open Graph cards and a `#` link on every section.

## Care

- **Performance:** a Playwright script opens the site, measures animation frame rates and flags long tasks that would stall the page.
- **Reduced motion:** with `prefers-reduced-motion`, non-essential animations are turned off.
- **Privacy:** there are no trackers or analytics cookies. The contact form uses Cloudflare Turnstile against spam.
