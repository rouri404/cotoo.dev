// Mermaid diagrams: lazy-loaded from the CDN only on posts that contain one, rendered when scrolled into view.
// Colors come from CSS variables (see blog.css), so theme changes never need a re-render.
(function () {
  const MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";

  let mermaidPromise = null;
  let counter = 0;

  function loadMermaid() {
    if (!mermaidPromise) {
      mermaidPromise = import(MERMAID_URL).then((mod) => mod.default);
    }
    return mermaidPromise;
  }

  function fontFamily() {
    return document.body.classList.contains("reading-mode")
      ? 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
      : '"Tiny5", sans-serif';
  }

  async function configure(mermaid) {
    // Mermaid measures text to size nodes, so the font must be loaded before rendering
    try {
      await document.fonts.load('16px "Tiny5"');
    } catch (_) {}
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      fontFamily: fontFamily(),
      htmlLabels: false,
      flowchart: { htmlLabels: false, useMaxWidth: true, curve: "linear", padding: 12 },
      sequence: { useMaxWidth: true, actorMargin: 40, mirrorActors: false },
      themeVariables: { fontSize: "16px" },
    });
  }

  async function renderBlock(block) {
    const source = block.querySelector(".mermaid-source code");
    const canvas = block.querySelector(".mermaid-canvas");
    if (!source || !canvas) return;

    block.dataset.state = "loading";
    try {
      const mermaid = await loadMermaid();
      await configure(mermaid);
      const { svg } = await mermaid.render("mermaid-svg-" + counter++, source.textContent);
      canvas.innerHTML = svg;
      block.dataset.state = "ready";
    } catch (err) {
      console.error("Falha ao renderizar diagrama:", err);
      canvas.textContent = "";
      block.dataset.state = "error";
      block.dataset.view = "code";
    }
  }

  function init() {
    const blocks = Array.from(document.querySelectorAll(".mermaid-block"));
    if (!blocks.length) return;

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observer.unobserve(entry.target);
                renderBlock(entry.target);
              }
            },
            { rootMargin: "400px 0px" }
          )
        : null;

    for (const block of blocks) {
      if (observer) observer.observe(block);
      else renderBlock(block);
    }

    // Diagram <-> source toggle
    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".mermaid-toggle");
      if (!btn) return;
      const block = btn.closest(".mermaid-block");
      if (!block) return;
      const showCode = block.dataset.view !== "code";
      block.dataset.view = showCode ? "code" : "diagram";
      btn.setAttribute("aria-pressed", String(showCode));
      btn.textContent = showCode ? "diagrama" : "código";
    });

    // The font mode changes text metrics, so already rendered diagrams are laid out again
    let lastReading = document.body.classList.contains("reading-mode");
    new MutationObserver(function () {
      const reading = document.body.classList.contains("reading-mode");
      if (reading === lastReading) return;
      lastReading = reading;
      for (const block of blocks) {
        if (block.dataset.state === "ready") renderBlock(block);
      }
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
