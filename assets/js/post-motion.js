// Post motion: reading progress bar
(function () {
  const prose = document.querySelector(".page-post .prose");
  if (!prose) return;

  const bar = document.createElement("div");
  bar.className = "reading-progress";
  bar.setAttribute("aria-hidden", "true");
  (document.querySelector(".blog-bar") || document.body).appendChild(bar);

  let ticking = false;
  function updateProgress() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    // Width, not a transform: a transformed layer is rastered apart and drifts a pixel from the border at fractional zoom
    bar.style.width = p * 100 + "%";
  }
  function requestProgress() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  }
  window.addEventListener("scroll", requestProgress, { passive: true });
  window.addEventListener("resize", requestProgress, { passive: true });
  updateProgress();
})();
