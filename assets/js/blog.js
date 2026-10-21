// Blog interactions: theme toggle with Bayer dither canvas transition, font mode, and code copying
(function () {
  const root = document.documentElement;
  let currentTheme = "light";
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      currentTheme = saved;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      currentTheme = "dark";
    }
  } catch (_) {}
  root.setAttribute("data-theme", currentTheme);

  const svgSun = `<svg viewBox="0 0 12 12" style="width:24px; height:24px; display:block;" fill="currentColor" shape-rendering="crispEdges">
  <rect x="5" y="1" width="2" height="2" />
  <rect x="5" y="9" width="2" height="2" />
  <rect x="1" y="5" width="2" height="2" />
  <rect x="9" y="5" width="2" height="2" />
  <rect x="2" y="2" width="2" height="2" />
  <rect x="8" y="2" width="2" height="2" />
  <rect x="2" y="8" width="2" height="2" />
  <rect x="8" y="8" width="2" height="2" />
  <rect x="4" y="4" width="4" height="4" />
</svg>`;

  const svgMoon = `<svg viewBox="0 0 12 12" style="width:24px; height:24px; display:block;" fill="currentColor" shape-rendering="crispEdges">
  <rect x="7" y="1" width="3" height="1" />
  <rect x="6" y="2" width="3" height="1" />
  <rect x="5" y="3" width="4" height="1" />
  <rect x="4" y="4" width="4" height="4" />
  <rect x="5" y="8" width="4" height="1" />
  <rect x="6" y="9" width="3" height="1" />
  <rect x="7" y="10" width="3" height="1" />
</svg>`;

  document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("themeToggle");
    const transCanvas = document.getElementById("pixel-transition");
    const transCtx = transCanvas ? transCanvas.getContext("2d") : null;
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    function updateThemeIcon() {
      if (themeToggle) {
        themeToggle.innerHTML = currentTheme === "light" ? svgMoon : svgSun;
        themeToggle.setAttribute("aria-label", currentTheme === "light" ? "Mudar para o tema escuro" : "Mudar para o tema claro");
      }
      if (metaTheme) {
        metaTheme.setAttribute("content", currentTheme === "dark" ? "#121212" : "#e3ecd7");
      }
    }
    updateThemeIcon();

    const blogBar = document.querySelector(".blog-bar");
    function updateBarHeight() {
      if (blogBar) {
        document.documentElement.style.setProperty("--bar-height", Math.ceil(blogBar.getBoundingClientRect().height) + "px");
      }
    }
    updateBarHeight();
    window.addEventListener("resize", updateBarHeight, { passive: true });

    // 1. Theme toggle with full Bayer dither transition wave matching initial screen
    let isTransitioning = false;
    if (themeToggle) {
      themeToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        if (isTransitioning) return;
        isTransitioning = true;

        const newTheme = currentTheme === "light" ? "dark" : "light";
        currentTheme = newTheme;
        try {
          localStorage.setItem("theme", newTheme);
        } catch (_) {}
        updateThemeIcon();

        const newBgColor = newTheme === "dark" ? "#121212" : "#e3ecd7";

        // With reduced motion the theme just switches, without the dither wave
        if (!transCanvas || !transCtx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          root.setAttribute("data-theme", newTheme);
          isTransitioning = false;
          return;
        }

        transCanvas.width = window.innerWidth;
        transCanvas.height = window.innerHeight;
        transCanvas.classList.add("active");
        document.body.classList.add("is-transitioning");

        // Hide scrolled content behind the transparent header, relative to the viewport
        const blogMain = document.querySelector(".blog-main");
        function clipMainBelowHeader() {
          if (!blogMain || !blogBar) return;
          const top = blogBar.getBoundingClientRect().height - blogMain.getBoundingClientRect().top;
          blogMain.style.clipPath = top > 0 ? `inset(${top}px -100vw 0 -100vw)` : "";
        }
        clipMainBelowHeader();
        window.addEventListener("scroll", clipMainBelowHeader, { passive: true });

        const elementsToFlip = document.querySelectorAll(
          '.blog-brand-link, .blog-nav-slash, .blog-nav-current, .crumbs, .crumbs a, .font-toggle, .theme-toggle, .post-header, h1, h2, h3, h4, h5, h6, p, li, .tag, .post-card, .post-card-title, .post-card-desc, .post-card-meta, .post-title, .post-desc, .post-meta, hr, blockquote, .callout, .callout-header, .callout-title, .callout-body, .callout-icon, .code-block, .mermaid-block, .mermaid-header, .mermaid-label, .mermaid-toggle, time, a, .prose :not(pre) > code, .table-wrap, table, th, td, .toc-title, .toc-list, .post-toc a, .post-search-label, .post-search-input, .post-search-empty, .mascot, .mascot-bubble, .mascot-bubble a, .mermaid-zoom-title, .mermaid-zoom-btn, .mermaid-zoom-stage, .term-title, .term-close, .term-line, .term-prompt, .term-input, .term-ghost, .rss-link'
        );

        const flips = Array.from(elementsToFlip).map((el) => {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const d = Math.sqrt((window.innerWidth - cx) ** 2 + cy ** 2);
          return { el, d, lag: 1 / 3, flipped: false };
        });

        // Split header text into letters so each one flips as the wave reaches it
        const splitEls = [];
        document.querySelectorAll(".blog-brand-link, .blog-nav-slash, .blog-nav-current, .font-toggle").forEach((el) => {
          if (el.children.length) return;
          const text = el.textContent;
          el.textContent = "";
          for (const ch of text) {
            const span = document.createElement("span");
            span.textContent = ch;
            el.appendChild(span);
            const rect = span.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const d = Math.sqrt((window.innerWidth - cx) ** 2 + cy ** 2);
            flips.push({ el: span, d, cx, cy, letter: true, flipped: false });
          }
          splitEls.push({ el, text });
        });

        const size = window.innerWidth > 768 ? 30 : 20;
        const cols = Math.ceil(window.innerWidth / size);
        const rows = Math.ceil(window.innerHeight / size) + 1;
        // Shift the grid so the header text sits in the middle of a cell row
        const headerMid = blogBar ? blogBar.getBoundingClientRect().height / 2 : 29;
        const gridOffsetY = ((headerMid - size / 2) % size) - size;

        const bayer = [
          [0, 8, 2, 10],
          [12, 4, 14, 6],
          [3, 11, 1, 9],
          [15, 7, 13, 5],
        ];
        const ditherBand = 12;
        const duration = 800;
        let startTime = null;
        const targetTextColor = newTheme === "dark" ? "#8fbc8b" : "#1c2e1c";
        const newTermBg = newTheme === "dark" ? "#0b140b" : "#d3e1c4";
        const targetRuleColor = newTheme === "dark" ? "rgba(143, 188, 139, 0.3)" : "rgba(28, 46, 28, 0.3)";
        // Sticky headings paint their background from these (see blog.css), so it follows the wave
        const stickies = Array.from(document.querySelectorAll(".post-section > h2, .post-subsection > h3, .mermaid-zoom"));
        root.style.setProperty("--tr-old-bg", newTheme === "dark" ? "#e3ecd7" : "#121212");
        root.style.setProperty("--tr-new-bg", newBgColor);
        root.style.setProperty("--tr-old-term-bg", newTheme === "dark" ? "#d3e1c4" : "#0b140b");
        root.style.setProperty("--tr-old-fg", newTheme === "dark" ? "#1c2e1c" : "#8fbc8b");
        root.style.setProperty("--tr-new-fg", targetTextColor);
        // The reading progress bar spans the header, so it is split where the wave crosses it instead of flipping whole
        const progressBar = document.querySelector(".reading-progress");
        root.style.setProperty("--tr-old-progress", newTheme === "dark" ? "#2d7a2d" : "#b9e4b4");
        root.style.setProperty("--tr-new-progress", newTheme === "dark" ? "#b9e4b4" : "#2d7a2d");
        const barHeight = blogBar ? Math.round(blogBar.getBoundingClientRect().height) : 58;
        const borderTop = barHeight - 2;
        const borderBottom = barHeight;

        // A letter flips exactly when the dither paints the cell under it
        function letterReached(flip, waveR) {
          const gx = Math.floor(flip.cx / size);
          const gy = Math.floor((flip.cy - gridOffsetY) / size);
          const threshold = (waveR - Math.sqrt((cols - gx) ** 2 + gy ** 2)) / ditherBand;
          return threshold > 0 && (threshold >= 1.0 || threshold > bayer[gy % 4][gx % 4] / 16);
        }

        function animateSweep(timestamp) {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1.0);
          const easeProgress = 1 - (1 - progress) * (1 - progress);
          const waveR = -ditherBand + (Math.sqrt(cols * cols + rows * rows) + ditherBand * 2) * easeProgress;

          transCtx.clearRect(0, 0, transCanvas.width, transCanvas.height);

          for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
              const cols_dist = cols - x;
              const d = Math.sqrt(cols_dist * cols_dist + y * y);
              const threshold = (waveR - d) / ditherBand;

              if (threshold > 0) {
                const b = bayer[y % 4][x % 4] / 16;
                if (threshold >= 1.0 || threshold > b) {
                  const rx = x * size - 0.5;
                  const ry = y * size + gridOffsetY - 0.5;
                  const rw = size + 1;
                  const rh = size + 1;

                  // 1. Draw new background square
                  transCtx.fillStyle = newBgColor;
                  transCtx.fillRect(rx, ry, rw, rh);

                  // 2. Draw new theme bottom border line inside this flipped pixel if it crosses the header bottom
                  if (borderBottom >= ry && borderTop <= ry + rh) {
                    transCtx.fillStyle = targetRuleColor;
                    transCtx.fillRect(rx, borderTop, rw, 2);
                  }
                }
              }
            }
          }

          if (window.paintTermWave) {
            window.paintTermWave({ size, cols, ditherBand, waveR, bayer, offsetY: gridOffsetY, bg: newTermBg, fg: targetTextColor });
          }

          const sweptR = Math.max(0, waveR - ditherBand * 0.5) * size;
          for (const el of stickies) {
            const r = el.getBoundingClientRect();
            el.style.setProperty("--wave-r", sweptR + "px");
            el.style.setProperty("--wave-x", window.innerWidth - r.left + "px");
            el.style.setProperty("--wave-y", -r.top - gridOffsetY + "px");
          }

          if (progressBar) {
            const y = progressBar.getBoundingClientRect().top + 1 - gridOffsetY;
            const reach = sweptR > y ? Math.sqrt(sweptR * sweptR - y * y) : 0;
            progressBar.style.setProperty("--wave-split", window.innerWidth - reach + "px");
          }

          for (const flip of flips) {
            if (!flip.flipped && (flip.letter ? letterReached(flip, waveR) : waveR - ditherBand * flip.lag > flip.d / size)) {
              flip.el.setAttribute("data-theme", newTheme);
              if (!flip.el.matches('.callout, .callout-header, .callout-title, .callout-icon, .post-toc a')) {
                flip.el.style.color = targetTextColor;
              }
              if (flip.el.matches('.post-header, h2, .post-subsection > h3, .post-search-input, hr, .code-block, .code-header, .mermaid-block, .mermaid-header, blockquote, .table-wrap, table, th, td')) {
                flip.el.style.borderColor = targetRuleColor;
              } else if (flip.el.matches('.tag, .post-card, .mascot-bubble, .rss-link')) {
                flip.el.style.borderColor = targetTextColor;
              }
              flip.flipped = true;
            }
          }

          if (progress < 1.0) {
            requestAnimationFrame(animateSweep);
          } else {
            root.setAttribute("data-theme", newTheme);
            for (const el of stickies) {
              el.style.removeProperty("--wave-r");
              el.style.removeProperty("--wave-x");
              el.style.removeProperty("--wave-y");
            }
            root.style.removeProperty("--tr-old-bg");
            root.style.removeProperty("--tr-new-bg");
            root.style.removeProperty("--tr-old-term-bg");
            root.style.removeProperty("--tr-old-fg");
            root.style.removeProperty("--tr-new-fg");
            root.style.removeProperty("--tr-old-progress");
            root.style.removeProperty("--tr-new-progress");
            if (progressBar) progressBar.style.removeProperty("--wave-split");
            for (const flip of flips) {
              flip.el.removeAttribute("data-theme");
              flip.el.style.color = "";
              flip.el.style.borderColor = "";
            }
            for (const { el, text } of splitEls) {
              el.textContent = text;
            }
            transCanvas.classList.remove("active");
            transCtx.clearRect(0, 0, transCanvas.width, transCanvas.height);
            document.body.classList.remove("is-transitioning");
            window.removeEventListener("scroll", clipMainBelowHeader);
            if (blogMain) blogMain.style.clipPath = "";
            isTransitioning = false;
          }
        }

        requestAnimationFrame(animateSweep);
      });
    }

    // 2. Font mode toggle ("Aa": reading font, the default rendered by the server, vs Tiny5 pixel font)
    const fontToggle = document.getElementById("fontToggle");

    function updateFontBtn() {
      const isReading = document.body.classList.contains("reading-mode");
      if (fontToggle) {
        fontToggle.textContent = "Aa";
        fontToggle.title = isReading ? "Mudar para fonte pixel" : "Mudar para modo de leitura";
        fontToggle.setAttribute("aria-label", fontToggle.title);
      }
    }

    try {
      if (localStorage.getItem("blog_font") === "pixel") {
        document.body.classList.remove("reading-mode");
      }
    } catch (_) {}
    updateFontBtn();

    if (fontToggle) {
      function toggleFontMode() {
        document.body.classList.toggle("reading-mode");
        const isReading = document.body.classList.contains("reading-mode");
        try {
          localStorage.setItem("blog_font", isReading ? "reading" : "pixel");
        } catch (_) {}
        updateFontBtn();
      }

      fontToggle.addEventListener("click", toggleFontMode);
      fontToggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFontMode();
        }
      });
    }

    // Read counter of the post: one read per post and browser session
    const views = document.querySelector(".post-views[data-slug]");
    if (views) {
      const slug = views.dataset.slug;
      let counted = false;
      try {
        counted = sessionStorage.getItem("read:" + slug) === "1";
      } catch (e) {}
      fetch("/api/views?slug=" + encodeURIComponent(slug), { method: counted ? "GET" : "POST" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
        .then(({ views: total }) => {
          try {
            sessionStorage.setItem("read:" + slug, "1");
          } catch (e) {}
          if (!(total > 0)) return;
          views.textContent = " · " + total.toLocaleString("pt-BR") + (total === 1 ? " leitura" : " leituras");
          views.hidden = false;
        })
        .catch(() => {});
    }

    // Section links: the "#" next to a heading copies the URL of that section
    document.addEventListener("click", function (e) {
      const anchor = e.target.closest(".heading-anchor");
      if (!anchor) return;
      e.preventDefault();
      const url = location.origin + location.pathname + anchor.getAttribute("href");
      history.replaceState(null, "", anchor.getAttribute("href"));
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(url).then(() => {
        anchor.classList.add("copied");
        setTimeout(() => anchor.classList.remove("copied"), 1500);
      }, () => {});
    });

    // 3. Code copy buttons
    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".copy-btn");
      if (!btn) return;
      const block = btn.closest(".code-block");
      if (!block) return;
      const codeEl = block.querySelector("pre code");
      if (!codeEl) return;

      const text = codeEl.innerText || codeEl.textContent || "";
      navigator.clipboard
        .writeText(text)
        .then(() => {
          btn.classList.add("copied");
          const span = btn.querySelector(".copy-text");
          if (span) span.textContent = "copiado!";
          setTimeout(() => {
            btn.classList.remove("copied");
            if (span) span.textContent = "copiar";
          }, 2000);
        })
        .catch((err) => {
          console.error("Falha ao copiar:", err);
        });
    });
  });
})();
