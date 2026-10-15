// Post search: filters the cards already on the blog index by title, description and tags
(function () {
  const box = document.querySelector(".post-search");
  const input = document.getElementById("postSearch");
  const empty = document.getElementById("postSearchEmpty");
  const items = Array.from(document.querySelectorAll(".post-list > li[data-search]"));
  if (!box || !input || !empty || !items.length) return;

  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const index = items.map((li) => ({ li, text: normalize(li.dataset.search) }));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  // Cards that stay glide to their new spot; cards that appear fade and rise in
  function animateChange(before) {
    let entering = 0;
    for (const { li } of index) {
      if (li.hidden) continue;
      if (before.has(li)) {
        const dy = before.get(li) - li.getBoundingClientRect().top;
        if (Math.abs(dy) > 1) {
          li.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 320, easing: EASE });
        }
      } else {
        li.animate(
          [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
          { duration: 380, delay: Math.min(entering++, 4) * 50, easing: EASE, fill: "backwards" }
        );
      }
    }
  }

  function filter(animate = true) {
    const motion = animate && !reduceMotion.matches;
    const before = new Map();
    if (motion) {
      for (const { li } of index) li.getAnimations().forEach((a) => a.cancel());
      for (const { li } of index) if (!li.hidden) before.set(li, li.getBoundingClientRect().top);
    }

    const terms = normalize(input.value).split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const { li, text } of index) {
      const match = terms.every((t) => text.includes(t));
      li.hidden = !match;
      if (match) shown++;
    }
    empty.hidden = shown > 0;
    if (motion) animateChange(before);

    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set("q", input.value.trim());
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }

  box.hidden = false;
  input.addEventListener("input", filter);

  document.addEventListener("keydown", (e) => {
    const isTyping = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === "/" && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      input.focus();
    } else if (e.key === "Escape" && document.activeElement === input) {
      input.value = "";
      filter();
      input.blur();
    }
  });

  const q = new URLSearchParams(location.search).get("q");
  if (q) {
    input.value = q;
    filter(false);
  }
})();
