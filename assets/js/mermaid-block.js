// Mermaid diagrams: lazy-loaded from the CDN only on posts that contain one, rendered when scrolled into view.
// Colors come from CSS variables (see blog.css), so theme changes never need a re-render.
// Once drawn, a diagram can be expanded into a zoom/pan window, and hovering a flowchart node lights up its links.
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

  // Hover highlight: the node, its edges, the nodes at the other end and their labels stay lit; the rest dims.
  // Mermaid names nodes flowchart-<id>-<n> and edges L_<start>_<end>_<n>, and draws the labels in edge order
  function enableHighlight(svg) {
    const nodeId = (node) => (node.id.match(/^flowchart-(.+)-\d+$/) || [])[1];
    const byId = new Map();
    for (const node of svg.querySelectorAll("g.node")) {
      const id = nodeId(node);
      if (id) byId.set(id, node);
    }
    if (!byId.size) return;

    // Which two nodes each edge joins, found by trying every pair against the edge id
    const labels = svg.querySelectorAll(".edgeLabel");
    const links = [];
    svg.querySelectorAll("path.flowchart-link").forEach((edge, i) => {
      for (const from of byId.keys()) {
        for (const to of byId.keys()) {
          if (new RegExp(`^L_${escapeRegex(from)}_${escapeRegex(to)}_\\d+$`).test(edge.id)) {
            links.push({ edge, from, to, label: labels[i] });
            return;
          }
        }
      }
    });

    function clear() {
      svg.classList.remove("is-focus");
      for (const el of svg.querySelectorAll(".is-lit")) el.classList.remove("is-lit");
    }

    function light(node) {
      const id = nodeId(node);
      if (!id) return;
      clear();
      const lit = [node];
      for (const { edge, from, to, label } of links) {
        if (from !== id && to !== id) continue;
        lit.push(edge, byId.get(from), byId.get(to));
        if (label) lit.push(label);
      }
      svg.classList.add("is-focus");
      for (const el of lit) el.classList.add("is-lit");
    }

    svg.addEventListener("pointerover", (e) => {
      const node = e.target.closest && e.target.closest("g.node");
      if (node) light(node);
      else clear();
    });
    svg.addEventListener("pointerleave", clear);
  }

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Zoom window: a copy of the diagram that can be dragged, pinched and wheel-zoomed
  let zoom = null;

  function closeZoom() {
    if (!zoom) return;
    const { panel, backdrop, opener, onKey } = zoom;
    zoom = null;
    document.removeEventListener("keydown", onKey, true);
    panel.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    setTimeout(() => {
      panel.remove();
      backdrop.remove();
    }, reduceMotion() ? 0 : 280);
    if (opener) opener.focus({ preventScroll: true });
  }

  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function openZoom(block, opener) {
    const source = block.querySelector(".mermaid-canvas svg");
    if (!source || zoom) return;

    const backdrop = document.createElement("div");
    backdrop.className = "mermaid-zoom-backdrop";
    const panel = document.createElement("section");
    panel.className = "mermaid-zoom";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Diagrama ampliado");
    panel.tabIndex = -1;
    panel.innerHTML =
      '<div class="mermaid-zoom-bar"><span class="mermaid-zoom-title"></span><div class="mermaid-zoom-tools">' +
      '<button class="mermaid-zoom-btn" type="button" data-act="out" aria-label="Diminuir" title="Diminuir (-)">-</button>' +
      '<button class="mermaid-zoom-btn" type="button" data-act="in" aria-label="Ampliar" title="Ampliar (+)">+</button>' +
      '<button class="mermaid-zoom-btn" type="button" data-act="fit" aria-label="Ajustar à janela" title="Ajustar (0)">1:1</button>' +
      '<button class="mermaid-zoom-btn" type="button" data-act="close" aria-label="Fechar" title="Fechar (Esc)">x</button></div></div>' +
      '<div class="mermaid-zoom-stage"><div class="mermaid-canvas"></div></div>';
    panel.querySelector(".mermaid-zoom-title").textContent = (block.querySelector(".mermaid-label") || {}).textContent || "diagrama";

    const stage = panel.querySelector(".mermaid-zoom-stage");
    const layer = panel.querySelector(".mermaid-canvas");
    const clone = source.cloneNode(true);
    const vb = source.viewBox.baseVal;
    const w = vb && vb.width ? vb.width : source.getBoundingClientRect().width;
    const h = vb && vb.height ? vb.height : source.getBoundingClientRect().height;
    clone.removeAttribute("style");
    clone.setAttribute("width", w);
    clone.setAttribute("height", h);
    layer.appendChild(clone);
    enableHighlight(clone);

    document.body.append(backdrop, panel);

    const view = { s: 1, x: 0, y: 0 };
    let fitScale = 1;
    const apply = () => (layer.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    function fit() {
      const sw = stage.clientWidth;
      const sh = stage.clientHeight;
      fitScale = Math.min((sw - 32) / w, (sh - 32) / h, 2);
      view.s = fitScale;
      view.x = (sw - w * fitScale) / 2;
      view.y = (sh - h * fitScale) / 2;
      apply();
    }

    // Zoom keeping the point under (px, py) in place
    function zoomAt(px, py, factor) {
      const s = clamp(view.s * factor, fitScale * 0.4, Math.max(6, fitScale * 4));
      view.x = px - (px - view.x) * (s / view.s);
      view.y = py - (py - view.y) * (s / view.s);
      view.s = s;
      apply();
    }

    const center = () => [stage.clientWidth / 2, stage.clientHeight / 2];

    stage.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const r = stage.getBoundingClientRect();
        zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
      },
      { passive: false }
    );

    // One pointer drags, two pointers pinch
    const pointers = new Map();
    let pinch = 0;
    stage.addEventListener("pointerdown", (e) => {
      stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      stage.classList.add("is-grabbing");
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    stage.addEventListener("pointermove", (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (pointers.size === 1) {
        view.x += dx;
        view.y += dy;
        apply();
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const r = stage.getBoundingClientRect();
        if (pinch) zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, dist / pinch);
        pinch = dist;
      }
    });
    const release = (e) => {
      pointers.delete(e.pointerId);
      pinch = 0;
      if (!pointers.size) stage.classList.remove("is-grabbing");
    };
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);
    stage.addEventListener("dblclick", fit);

    panel.addEventListener("click", (e) => {
      const btn = e.target.closest(".mermaid-zoom-btn");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "close") closeZoom();
      else if (act === "fit") fit();
      else zoomAt(...center(), act === "in" ? 1.35 : 1 / 1.35);
    });
    backdrop.addEventListener("click", closeZoom);

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeZoom();
      } else if (e.key === "+" || e.key === "=") zoomAt(...center(), 1.35);
      else if (e.key === "-") zoomAt(...center(), 1 / 1.35);
      else if (e.key === "0") fit();
    };
    document.addEventListener("keydown", onKey, true);

    zoom = { panel, backdrop, opener, onKey };
    fit();
    requestAnimationFrame(() => {
      panel.classList.add("is-open");
      backdrop.classList.add("is-open");
      panel.focus({ preventScroll: true });
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
      enableHighlight(canvas.querySelector("svg"));
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
      // The header gets an "expandir" button next to "código"
      const header = block.querySelector(".mermaid-header");
      const toggle = block.querySelector(".mermaid-toggle");
      if (header && toggle) {
        const actions = document.createElement("div");
        actions.className = "mermaid-actions";
        const expand = document.createElement("button");
        expand.className = "mermaid-toggle mermaid-expand";
        expand.type = "button";
        expand.title = "Ampliar o diagrama";
        expand.textContent = "expandir";
        actions.append(expand, toggle);
        header.appendChild(actions);
      }
      if (observer) observer.observe(block);
      else renderBlock(block);
    }

    document.addEventListener("click", function (e) {
      const expand = e.target.closest(".mermaid-expand");
      if (expand) {
        const block = expand.closest(".mermaid-block");
        if (block) openZoom(block, expand);
      }
    });

    // Diagram <-> source toggle
    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".mermaid-toggle:not(.mermaid-expand)");
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
