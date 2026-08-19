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

### 3. APIs & Backend
- **GitHub API:** To fetch real-time commit data, ALWAYS use the **GitHub Search API** (`/search/commits`) instead of the Events API (`/events`), because the Events API has a 15-30 minute caching delay.
- **Vercel Rate Limits:** Add `Cache-Control` headers (e.g., `s-maxage=60, stale-while-revalidate=120`) to Vercel serverless functions to avoid hitting third-party API rate limits.

### 4. General Best Practices
- Do NOT randomly reformat code or change variables unrelated to the user's explicit request.
- When making small fixes, avoid creating unnecessary multiple commits. Ask to amend or squash if the changes belong to the same logical feature.
