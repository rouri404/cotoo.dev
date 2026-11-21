// Language switch between / and /en/: the old page stores the stage, the scroll and the widgets' data (widgetData in
// script.js), the new one resumes from them (langSwap). Deferred from the <head> of index.html, so the menu is complete
// when the scroll is restored; after a switch the first paint waits for it
(function () {
  const wrapper = document.querySelector(".scroll-wrapper");
  if (langSwap && langSwap.stage === "menu") {
    goToMenu();
    if (wrapper) wrapper.scrollTo({ top: langSwap.scroll || 0, behavior: "instant" });
  }
  // A frame later the no-transition class goes
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove("lang-swap")));

  const link = document.querySelector(".nav-lang");
  if (!link) return;
  link.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    try {
      sessionStorage.setItem("lang_swap", JSON.stringify({
        stage: document.body.dataset.stage || "hero",
        scroll: wrapper ? wrapper.scrollTop : 0,
        ...widgetData,
        t: Date.now(),
      }));
    } catch (_) {}
  });
})();
