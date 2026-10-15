# Agents Guidelines for cotoo.dev

This file provides context and strict rules for any AI agent working on the `cotoo.dev` project.

## Project Context
- **Tech Stack:** Vanilla HTML, CSS, and JavaScript. No external UI frameworks (React, Vue, etc.).
- **Architecture:** Static frontend deployed on Vercel, with a few serverless functions in `/api` (like `github.js` for proxying API calls).
- **Goal:** A highly interactive, performant, and retro/pixel-art themed portfolio website.

## Coding Rules & Guidelines

### 1. Language & Documentation
- **Comments & Docstrings:** ALWAYS write code comments in **English**. Keep them concise, capitalized properly, and remove obvious inline explanations. Avoid clutter.
- **Commit Messages:** Follow the Conventional Commits specification (`feat:`, `fix:`, `refactor:`, etc.) in English. Keep the commit history clean (squash small, messy commits if necessary before pushing). **DO NOT** add a description/body to the commits. Keep them as a single line.

### 2. CSS & UI/UX
- **Hover Animations:** Be extremely careful with `transform: translateY` or similar properties on hover states. They easily cause "hover flickering" when the user's cursor is near the edge of the element.
  - *Fix Pattern:* Always use a synchronized `::after` pseudo-element with an inverse transform (e.g. `transform: translateY(6px)`) to maintain a stationary hit area.
- **Pixel Art Assets:** When aligning SVGs and PNG pixel art (e.g., in `.socials` or `.theme-toggle`), rely on precise CSS centering, but manually verify optical alignment (`top` or `margin`) since PNG padding might differ from SVG bounding boxes.
- **Mobile First/Media Queries:** The site is heavily responsive. Ensure `max-width: 600px` rules are carefully tested, especially for fixed elements.
- **Theme Transitions (MANDATORY):** Every new element, component, or style that has any theme-dependent color MUST be wired into the theme transition. This is not optional and not a follow-up task: do it in the same change that introduces the element. See **Section 4** for the full checklist.

### 3. APIs & Backend
- **GitHub API:** To fetch real-time commit data, ALWAYS use the **GitHub Search API** (`/search/commits`) instead of the Events API (`/events`), because the Events API has a 15-30 minute caching delay.
- **Cache-Control Headers:** Apply appropriate caching to serverless functions:
  - Proxied external reads: Use `s-maxage=60, stale-while-revalidate=120` to prevent third-party rate limits.
  - Real-time/counter endpoints (e.g. `/api/visits`): ALWAYS use `Cache-Control: no-store`.
- **Input Sanitization & Injection Prevention:** ALWAYS validate and sanitize user input in API endpoints. HTML-escape values before embedding in email bodies, validate email addresses strictly (disallow angle brackets/quotes), and strip control characters from header fields (`From`, `Subject`) to prevent email header injection.
- **Endpoint Protection & Invalid Query Handling:** Endpoints generating assets or handling dynamic requests (e.g. `/api/og`) must strictly validate required parameters. If queries are missing or invalid, redirect (`res.redirect(302, '/')`) or reject early, rather than rendering fallback/arbitrary content.
- **Environment Checks (Fail-Closed):** For development-only relaxations (CORS, origin checks, Turnstile validation), ALWAYS check `process.env.VERCEL_ENV === 'development'`. Never check `!== 'production'`, as preview deployments and unset environment variables must remain secure.
- **Redis Integration:** Use `@upstash/redis` (REST-based). For local development, support `KV_REST_API_URL` and `KV_REST_API_TOKEN` through a serverless REST proxy (e.g. `hiett/serverless-redis-http` via Docker Compose) before falling back to production Upstash variables.

### 4. Theme Transition Checklist (MANDATORY for every new element)

Switching theme plays a canvas Bayer dither wave that sweeps from the top-right corner. Each element must flip its colors at the exact moment the wave reaches it. An element that is not wired in will pop, lag, stay in the old theme until the animation ends, or even disappear mid-transition.

**There are TWO independent transition scripts. Edit the one for the page where the element lives (or both):**

| Page | File | List to update |
| :--- | :--- | :--- |
| Home (`index.html`) | `assets/js/script.js` | `elementsToFlip` |
| Blog (`/blog`, `/blog/[slug]`) | `assets/js/blog.js` | `elementsToFlip` |

Do not assume the list in `script.js` covers the blog. It does not.

**Before considering a UI change done, ALL of the following must be true:**

1. **Selector in `elementsToFlip`.** Add the selector of every new element that has a theme-dependent color, background, border, or filter. Flip the *leaf* elements that actually paint the color (e.g. `.toc-title`, `.post-toc a`), NOT a large container. CSS custom properties are inherited, so flipping a container re-colors its whole subtree at once when the wave hits the container's center, which looks like a chunk popping instead of a sweep.
2. **Colors come from theme variables only.** Use the variables defined under `[data-theme="light"]` and `[data-theme="dark"]` (`--bg-color`, `--text-color`, `--rule-color`, etc.). Never hardcode a hex/rgba color that differs per theme. If you need a new color, add the variable to BOTH theme blocks (in `style.css` and/or `blog.css`). For translucent backgrounds use `rgba(var(--bg-rgb), 0.95)`.
3. **Variable lookup happens on the element itself.** The flip works by setting `data-theme` on the element, which redefines the variables for it. A property that reads `var(--x)` flips; a property with a literal color does not. `[data-theme="light"] .foo` selectors do NOT match in the default light theme (the root has no attribute), so never use them for theme styling. Define a variable per theme instead.
4. **Inline color overrides.** The flip code sets `style.color` (and `style.borderColor` for the elements listed in its `matches(...)` call) while the wave passes, then clears it. If the element has its own color logic (active/hover states, callouts, semantic colors), exclude it from the inline `color` assignment (see the `.callout` / `.post-toc a` exclusion in `blog.js`), otherwise it loses its color until the animation ends. If the element has a themed border, add it to the `borderColor` `matches(...)` list.
5. **Hardcoded values inside the JS.** When a new theme color is introduced or changed, update the constants in the transition code: the new background (`newBgColor`), `targetTextColor`, `targetRuleColor`, `targetLogoFilter`, the `meta[name="theme-color"]` value, and the pixel trail color. Keep them equal to the CSS variables.
6. **Do not get clipped or covered during the transition.**
   - `#pixel-transition` is `position: fixed` with `z-index: 5`. New elements must sit above it (the blog content lives in `.blog-main`, `z-index: 10`) or the dither canvas paints over them.
   - In the blog, `blog.js` applies a `clip-path` to `.blog-main` while transitioning. Anything positioned outside the `.blog-main` box (for example the ToC, which sits to its right) is clipped unless the clip keeps negative horizontal insets, as `clipMainBelowHeader` does today. Never reduce those insets.
   - `body.is-transitioning *` forces `transition: none !important`. Do not rely on CSS transitions for theme color changes.
   - Elements above the canvas that have a solid or semi-opaque `background` (sticky headings, fixed bars, cards) show the NEW theme as a flat rectangle before the wave reaches them. While `body.is-transitioning` is set, make that background transparent (see `.blog-bar` and the sticky `h2`/`h3` rules in `blog.css`). Sticky headings are the exception: post text slides beneath them, so they paint the old and new colours in two layers and `blog.js` clips the new one to the area the wave has swept (see the `--wave-*` variables).
7. **Elements injected by JavaScript** (generated ToC, split letters, wrapped sections, widgets rendered after load) are not in the DOM when you write the CSS, but `elementsToFlip` queries the DOM at click time. Make sure their selectors are in the list and that they exist when the user toggles the theme.

**How to verify (required, not optional):** toggle the theme with the new element visible, in both directions (light to dark and dark to light), and watch the whole animation. Confirm the element (a) never disappears, (b) changes color progressively as the wave passes, not all at once and not at the end, and (c) has no color pop after the animation finishes. If you cannot run a browser, say so explicitly instead of assuming it works.

### 5. General Best Practices
- Do NOT randomly reformat code or change variables unrelated to the user's explicit request.
- When making small fixes, avoid creating unnecessary multiple commits. Ask to amend or squash if the changes belong to the same logical feature.
