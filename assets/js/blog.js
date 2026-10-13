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
      }
      if (metaTheme) {
        metaTheme.setAttribute("content", currentTheme === "dark" ? "#121212" : "#8fbc8b");
      }
    }
    updateThemeIcon();

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

        const newBgColor = newTheme === "dark" ? "#121212" : "#8fbc8b";

        if (!transCanvas || !transCtx) {
          root.setAttribute("data-theme", newTheme);
          isTransitioning = false;
          return;
        }

        transCanvas.width = window.innerWidth;
        transCanvas.height = window.innerHeight;
        transCanvas.classList.add("active");
        document.body.classList.add("is-transitioning");

        const elementsToFlip = document.querySelectorAll(
          '.blog-bar, .blog-brand-link, .blog-nav-slash, .crumbs, .crumbs a, .font-toggle, .theme-toggle, .post-header, h1, h2, h3, h4, h5, h6, p, li, .tag, .post-card, .post-card-title, .post-card-desc, .post-card-meta, .post-title, .post-desc, .post-meta, hr, blockquote, .callout, .callout-header, .callout-title, .callout-body, .callout-icon, .code-block, .code-header, .code-lang, .copy-btn, .copy-text, time, a, pre, code, .table-wrap, table, th, td'
        );

        const flips = Array.from(elementsToFlip).map((el) => {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const d = Math.sqrt((window.innerWidth - cx) ** 2 + cy ** 2);
          return { el, d, flipped: false };
        });

        const size = window.innerWidth > 768 ? 30 : 20;
        const cols = Math.ceil(window.innerWidth / size);
        const rows = Math.ceil(window.innerHeight / size);

        const bayer = [
          [0, 8, 2, 10],
          [12, 4, 14, 6],
          [3, 11, 1, 9],
          [15, 7, 13, 5],
        ];
        const ditherBand = 12;
        const duration = 800;
        let startTime = null;
        const targetTextColor = newTheme === "dark" ? "#8fbc8b" : "#121212";
        const targetRuleColor = newTheme === "dark" ? "rgba(143, 188, 139, 0.3)" : "rgba(18, 18, 18, 0.35)";

        function animateSweep(timestamp) {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1.0);
          const easeProgress = 1 - (1 - progress) * (1 - progress);
          const waveR = -ditherBand + (Math.sqrt(cols * cols + rows * rows) + ditherBand * 2) * easeProgress;

          transCtx.clearRect(0, 0, transCanvas.width, transCanvas.height);
          transCtx.fillStyle = newBgColor;

          for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
              const cols_dist = cols - x;
              const d = Math.sqrt(cols_dist * cols_dist + y * y);
              const threshold = (waveR - d) / ditherBand;

              if (threshold > 0) {
                const b = bayer[y % 4][x % 4] / 16;
                if (threshold >= 1.0 || threshold > b) {
                  transCtx.fillRect(x * size - 0.5, y * size - 0.5, size + 1, size + 1);
                }
              }
            }
          }

          for (const flip of flips) {
            if (!flip.flipped && waveR - ditherBand / 1.5 > flip.d / size) {
              flip.el.setAttribute("data-theme", newTheme);
              if (!flip.el.matches('.callout, .callout-header, .callout-title, .callout-icon')) {
                flip.el.style.color = targetTextColor;
              }
              if (flip.el.matches('.blog-bar, .post-header, h2, hr, .code-block, .code-header, blockquote, .table-wrap, table, th, td')) {
                flip.el.style.borderColor = targetRuleColor;
              } else if (flip.el.matches('.tag, .post-card')) {
                flip.el.style.borderColor = targetTextColor;
              }
              if (flip.el.matches('.blog-bar')) {
                flip.el.style.backgroundColor = newBgColor;
              }
              flip.flipped = true;
            }
          }

          if (progress < 1.0) {
            requestAnimationFrame(animateSweep);
          } else {
            root.setAttribute("data-theme", newTheme);
            for (const flip of flips) {
              flip.el.removeAttribute("data-theme");
              flip.el.style.color = "";
              flip.el.style.borderColor = "";
              if (flip.el.matches('.blog-bar')) {
                flip.el.style.backgroundColor = "";
              }
            }
            transCanvas.classList.remove("active");
            transCtx.clearRect(0, 0, transCanvas.width, transCanvas.height);
            document.body.classList.remove("is-transitioning");
            isTransitioning = false;
          }
        }

        requestAnimationFrame(animateSweep);
      });
    }

    // 2. Font mode toggle ("Aa": default text font vs Tiny5 pixel font)
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
      if (localStorage.getItem("blog_font") === "reading") {
        document.body.classList.add("reading-mode");
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
