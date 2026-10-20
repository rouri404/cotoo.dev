// Post reading navigation: stacking sticky headings and a scrollspy table of contents
(function () {
  const prose = document.querySelector(".page-post .prose");
  const main = document.querySelector(".blog-main");
  if (!prose || !main) return;

  const MIN_TOC_ITEMS = 3;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function make(tag, className) {
    const el = document.createElement(tag);
    el.className = className;
    return el;
  }

  // Wrap each h2 (and each h3 inside it) with the content that follows, so that
  // position: sticky is bounded by its own section and the next heading pushes it away
  function wrapSections() {
    let section = null;
    let sub = null;
    for (const node of Array.from(prose.children)) {
      if (node.tagName === "H2") {
        section = make("section", "post-section");
        sub = null;
        prose.insertBefore(section, node);
        section.appendChild(node);
      } else if (node.tagName === "H3" && section) {
        sub = make("div", "post-subsection");
        section.appendChild(sub);
        sub.appendChild(node);
      } else if (section) {
        (sub || section).appendChild(node);
      }
    }
  }

  wrapSections();

  const sections = Array.from(prose.querySelectorAll(".post-section"));
  const subsections = Array.from(prose.querySelectorAll(".post-subsection"));
  if (!sections.length) return;

  const wrappers = Array.from(prose.querySelectorAll(".post-section, .post-subsection"));
  const headingOf = (wrapper) => wrapper.firstElementChild;

  function barHeight() {
    const bar = document.querySelector(".blog-bar");
    return bar ? bar.offsetHeight : 58;
  }

  function stickyOffset(wrapper) {
    const heading = headingOf(wrapper);
    let offset = barHeight();
    if (heading.tagName === "H3" && getComputedStyle(heading).position === "sticky") {
      offset += headingOf(wrapper.parentElement).offsetHeight;
    }
    return offset;
  }

  function scrollToWrapper(wrapper, instant) {
    const top = wrapper.getBoundingClientRect().top + window.scrollY - stickyOffset(wrapper);
    window.scrollTo({ top: Math.max(0, top), behavior: instant || reducedMotion.matches ? "instant" : "smooth" });
  }

  // Keep each section aware of its own h2 height so the h3 can stack right below it
  function syncH2Heights() {
    for (const section of sections) {
      section.style.setProperty("--h2-h", headingOf(section).offsetHeight + "px");
    }
  }

  // Table of contents
  const tocItems = wrappers.map((wrapper) => {
    const heading = headingOf(wrapper);
    const label = heading.cloneNode(true);
    label.querySelectorAll(".heading-anchor").forEach((a) => a.remove());
    return { wrapper, id: heading.id, level: heading.tagName === "H3" ? 3 : 2, text: label.textContent.trim() };
  });

  let toc = null;
  const linkById = new Map();

  if (tocItems.length >= MIN_TOC_ITEMS) {
    toc = make("aside", "post-toc");
    toc.setAttribute("aria-label", "Nesta página");
    const inner = make("div", "post-toc-inner");
    const title = make("p", "toc-title");
    title.textContent = "// nesta página";
    const list = make("ul", "toc-list");

    for (const item of tocItems) {
      const li = make("li", "toc-item toc-item-h" + item.level);
      const a = document.createElement("a");
      a.href = "#" + item.id;
      a.textContent = item.text;
      li.appendChild(a);
      list.appendChild(li);
      linkById.set(item.id, a);
    }

    inner.append(title, list);
    toc.appendChild(inner);
    main.appendChild(toc);

    list.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      e.preventDefault();
      const item = tocItems.find((it) => "#" + it.id === link.getAttribute("href"));
      if (!item) return;
      scrollToWrapper(item.wrapper, false);
      history.replaceState(null, "", "#" + item.id);
    });
  }

  // Scrollspy: a 1px band just below the header (and below the stuck h2 for h3s)
  // marks which section is currently pinned at the top
  const inBandH2 = new Set();
  const inBandH3 = new Set();
  let activeId = null;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    if (!toc) return;
    for (const [linkId, a] of linkById) {
      const active = linkId === id;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
    const link = linkById.get(id);
    const inner = toc.firstElementChild;
    if (link && inner) {
      const top = link.offsetTop;
      const bottom = top + link.offsetHeight;
      if (top < inner.scrollTop) inner.scrollTop = top - 8;
      else if (bottom > inner.scrollTop + inner.clientHeight) inner.scrollTop = bottom - inner.clientHeight + 8;
    }
  }

  function updateActive() {
    let section = null;
    for (const s of sections) if (inBandH2.has(s)) section = s;
    let sub = null;
    if (section) {
      for (const s of subsections) if (inBandH3.has(s) && s.parentElement === section) sub = s;
    }
    const wrapper = sub || section;
    setActive(wrapper ? headingOf(wrapper).id : null);
  }

  let observers = [];

  function observe(targets, set, offset) {
    const bottom = Math.max(0, window.innerHeight - offset - 1);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) set.add(entry.target);
          else set.delete(entry.target);
        }
        updateActive();
      },
      { rootMargin: `-${offset}px 0px -${bottom}px 0px`, threshold: 0 }
    );
    targets.forEach((t) => io.observe(t));
    observers.push(io);
  }

  function setupObservers() {
    observers.forEach((io) => io.disconnect());
    observers = [];
    inBandH2.clear();
    inBandH3.clear();
    const bar = barHeight();
    const h2Max = Math.max(...sections.map((s) => headingOf(s).offsetHeight));
    observe(sections, inBandH2, bar + 1);
    if (subsections.length) observe(subsections, inBandH3, bar + h2Max + 1);
  }

  let pending = false;
  function refresh() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      syncH2Heights();
      setupObservers();
    });
  }

  syncH2Heights();
  setupObservers();

  window.addEventListener("resize", refresh, { passive: true });
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(refresh);
    sections.forEach((s) => ro.observe(headingOf(s)));
  }

  // Land on the right spot for deep links, since headings are sticky and wrapped after load
  if (location.hash.length > 1) {
    let target = null;
    try {
      target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch (_) {}
    const wrapper = target && wrappers.find((w) => headingOf(w) === target);
    if (wrapper) requestAnimationFrame(() => scrollToWrapper(wrapper, true));
  }
})();
