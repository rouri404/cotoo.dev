console.log(
  "%c\n" +
  "   ____      __              __\n" +
  "  / __/___  / /____  ___    / /\n" +
  " / /_/ __ \\/ __/ _ \\/ _ \\  /_/ \n" +
  " \\__/\\____/\\__/\\___/\\___/ (_)\n" +
  "\n" +
  "olhando o codigo, amigao? \n" +
  "vamo lá bate um papo \n" +
  "quem sabe sou o novo linus :p \n" +
  "https://linkedin.com/in/gabricouto",
  "color: #8FBC8B; font-size: 14px; font-weight: bold; font-family: monospace;"
);

const canvas = document.getElementById("pixel-trail");
const ctx = canvas.getContext("2d");
const FADE_DURATION = 500;
let pixelSize = 24;
const activePixels = new Map();

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  pixelSize = window.innerWidth < 768 ? 16 : 24;
}

function draw(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = trailTheme === "dark" ? "#8FBC8B" : "#1C2E1C";
  for (const [key, startTime] of activePixels) {
    const elapsed = now - startTime;
    if (elapsed >= FADE_DURATION) {
      activePixels.delete(key);
    } else {
      const opacity = 1 - elapsed / FADE_DURATION;
      const [col, row] = key.split(",").map(Number);
      ctx.globalAlpha = opacity;
      ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 1;
  requestAnimationFrame(draw);
}

function handlePointerMove(e) {
  if (e.pointerType === "touch") return;
  // No trail over the terminal (or while dragging it): the squares would be left behind as the window moves
  if (e.target.closest && e.target.closest(".term")) return;
  const col = Math.floor(e.clientX / pixelSize);
  const row = Math.floor(e.clientY / pixelSize);
  const key = `${col},${row}`;
  activePixels.set(key, performance.now());
}

const heroStage = document.getElementById("stage-hero");
const menuStage = document.getElementById("stage-menu");

// Education progress (FIAP Aug 2024 – Jul 2028)
(function initEducationProgress() {
  const start = new Date(2024, 7, 1);  // Aug 1, 2024
  const end = new Date(2028, 6, 31);   // Jul 31, 2028
  const now = new Date();
  const totalMs = end - start;
  const elapsedMs = Math.max(0, Math.min(now - start, totalMs));
  const pct = (elapsedMs / totalMs) * 100;

  const totalMonths = Math.floor(elapsedMs / (1000 * 60 * 60 * 24 * 30.44));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const bars = document.querySelectorAll(".education-progress-bar-fill");
  const labels = document.querySelectorAll(".education-elapsed-text");
  bars.forEach(bar => {
    if (bar) bar.style.width = pct.toFixed(1) + "%";
  });
  labels.forEach(label => {
    if (label) {
      const parts = [];
      if (years > 0) parts.push(years + (years === 1 ? " ano" : " anos"));
      if (months > 0) parts.push(months + (months === 1 ? " mês" : " meses"));
      label.textContent = (parts.length ? parts.join(" e ") : "início") + " — " + pct.toFixed(0) + "% concluído";
    }
  });
})();

function goToMenu() {
  if (document.body.dataset.stage === "menu") return;
  document.body.dataset.stage = "menu";
  heroStage.classList.remove("active");
  menuStage.classList.add("active");
  const wrapper = document.querySelector(".scroll-wrapper");
  if (wrapper) wrapper.scrollTop = 0;
}

function goToHero() {
  if (document.body.dataset.stage === "hero") return;
  document.body.dataset.stage = "hero";
  menuStage.classList.remove("active");
  heroStage.classList.add("active");
}

window.addEventListener("resize", resize);

window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("click", (e) => {
  const sel = window.getSelection ? window.getSelection().toString() : "";
  if (sel && sel.trim().length > 0) return;

  if (e.target.closest("a, button, input, textarea, .top-nav, .theme-toggle, .nav-blog-btn, .modal-content, .custom-notification, .spotify-widget, .mascot, .mascot-bubble, .term, .activity-section")) {
    return;
  }

  if (document.body.dataset.stage === "hero") {
    goToMenu();
  } else {
    goToHero();
  }
});

window.addEventListener(
  "wheel",
  (e) => {
    const stage = document.body.dataset.stage || "hero";
    if (stage === "hero") {
      if (e.deltaY > 20) goToMenu();
    } else if (stage === "menu") {
      const wrapper = document.querySelector(".scroll-wrapper");
      if (wrapper && e.deltaY < -20 && wrapper.scrollTop <= 0) {
        goToHero();
      }
    }
  },
  { passive: true },
);

let _ks = "";

window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
    _ks = "";
  } else if (e.key && e.key.length === 1) {
    _ks += e.key.toLowerCase();
    if (_ks.length > 4) _ks = _ks.slice(-4);
    if (_ks === [99,111,116,111].map(c => String.fromCharCode(c)).join("")) {
      firePixelConfetti();
      setTimeout(() => {
        const _o = document.createElement("div");
        _o.className = "modal-overlay active";
        _o.onclick = () => _o.remove();
        const _c = document.createElement("div");
        _c.className = "modal-content";
        _c.onclick = (ev) => ev.stopPropagation();
        const _b = document.createElement("button");
        _b.className = "modal-close";
        _b.title = "fechar";
        _b.textContent = "x";
        _b.onclick = () => _o.remove();
        _c.appendChild(_b);
        _c.insertAdjacentHTML("beforeend", decodeURIComponent(escape(atob("PHAgZGF0YS1ub3NuaXBwZXQ+PHN0cm9uZz5PIFRBTCBETyBDT1RPPC9zdHJvbmc+PGJyPjxicj5TZSB2b2PDqiB2ZWlvIHBhcmFyIGFxdWkgcGVzcXVpc2FuZG8gbWV1IG5vbWUsIGltYWdpbm8gcXVlIHF1ZWlyYSBzYWJlciBxdWVtIGV1IHNvdSBkZSB2ZXJkYWRlLCBuw6k/PGJyPjxicj5QcmEgZmFsYXIgZGUgaG9iYnksIHRlbmhvIHVtYSBmaXhhw6fDo28gbWVpbyBpbmV4cGxpY8OhdmVsIHBvciBjb2lzYXMgdmVsaGFzIGUgZ2FzdGFzIHBlbG8gdGVtcG8uIENhcmhhcnR0cyBhbnRpZ2FzLCByb3VwYSBjb20gc3VuIGZhZGVzIGJpemFycm9zLCBkZW5pbSBkZXN0cnXDrWRvIGRlIHVzbyBlIG9wZW4tc291cmNlIGF0w6kgbyB0YWxvLiBCYXNpY2FtZW50ZSwgY29pc2FzIHF1ZSB0w6ptIGhpc3TDs3JpYSwgcGVyc29uYWxpZGFkZSBlIGF0aXR1ZGUuPGJyPjxicj5FIGNsYXJvLCBjb21vIG7Do28gdml2byBzZW0gbWV1cyBmb25lcyBkZSBvdXZpZG8sIHBhc3NvIG8gdGVtcG8gb3V2aW5kbyBtYXRoLXJvY2suIFNlIG7Do28gY29uaGVjZSwgcG9lIGHDrSBubyBTcG90aWZ5IHVtIFRUTkcsIHRvZSwgdGhlIGNhYnMgb3UgQW1lcmljYW4gRm9vdGJhbGwgcHJhIGVudGVuZGVyIG8gY2xpbWEgKHNlIGN1cnRpciwgYWluZGEgdGVtIEp1c3QgTmVpZ2hib3JzLCBhcmNoaXBpw6lsYWdvcyBlIFRvdG9ycm8pLjwvcD4="))));
        _o.appendChild(_c);
        document.body.appendChild(_o);
      }, 800);
      _ks = "";
    }
  }

  if (e.key === "Escape") {
    const activeModals = document.querySelectorAll(".modal-overlay.active");
    if (activeModals.length > 0) {
      activeModals.forEach((modal) => modal.classList.remove("active"));
      if (document.activeElement) document.activeElement.blur();
      return;
    }
  }

  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
  if (activeTag === "input" || activeTag === "textarea") {
    return;
  }

  if (["Enter", " ", "ArrowDown", "PageDown"].includes(e.key)) goToMenu();
  if (["Escape", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) goToHero();
});

document.querySelectorAll(".projects li").forEach((li) => {
  li.addEventListener("click", (e) => {
    const sel = window.getSelection ? window.getSelection().toString() : "";
    if (sel && sel.trim().length > 0) return;

    e.stopPropagation();
    const url = li.getAttribute("data-url");
    const modalId = li.getAttribute("data-modal");
    
        // Lock 3D flip hover effect
    li.classList.add("is-clicked");
    
    if (modalId) {
            // Open modal instantly
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.add("active");
      setTimeout(() => li.classList.remove("is-clicked"), 100);
    } else if (url) {
            // Wait for flip animation before external redirect
      setTimeout(() => {
        if (url.startsWith("/")) {
          window.location.href = url;
        } else {
          window.open(url, "_blank", "noopener");
        }
        setTimeout(() => li.classList.remove("is-clicked"), 100);
      }, 400);
    }
  });
  li.addEventListener("keydown", (e) => {
    if (e.key === "Enter") li.click();
  });
});

const contactEmail = document.getElementById("contactExpandBtn");
const contactExpandable = document.getElementById("contactExpandable");

if (contactExpandable) {
  contactExpandable.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

const mailtoLink = document.querySelector("a.contact-email");
if (mailtoLink) {
  mailtoLink.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

if (contactEmail && contactExpandable) {
  contactEmail.addEventListener("click", (e) => {
    e.preventDefault();
    contactExpandable.classList.toggle("is-expanded");
  });
}

const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("contactSubmit");
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = "enviando...";
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (res.status === 429) {
        showNotification("Muitas tentativas, tente mais tarde.");
      } else if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showNotification(errorData.error || "Algo deu errado. Tente novamente mais tarde.");
      } else {
        showNotification("Mensagem enviada com sucesso!");
        contactForm.reset();
        const contactExpandable = document.getElementById("contactExpandable");
        if (contactExpandable) contactExpandable.classList.remove("is-expanded");
      }
    } catch (err) {
      console.error(err);
      showNotification("Erro de conexão. Tente novamente.");
    } finally {
      btn.disabled = false;
      btn.textContent = "enviar";
      if (typeof turnstile !== "undefined") {
        turnstile.reset();
      }
    }
  });
}

resize();
document.body.dataset.stage = "hero";
requestAnimationFrame(draw);
class ScrambleText {
  constructor(el) {
    this.el = el;
    this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+-=?";
    this.originalText = this.el.dataset.original || this.el.textContent.trim();
    this.el.dataset.original = this.originalText;
    this.interval = null;
    this.isScrambling = false;
  }
  start() {
    if (this.isScrambling) return;
    this.isScrambling = true;
    let iteration = 0;
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      let visiblePart = "";
      let hiddenPart = "";
      for (let i = 0; i < this.originalText.length; i++) {
        if (i < Math.floor(iteration)) {
          visiblePart += this.originalText[i];
        } else if (i < Math.floor(iteration) + 2) {
          visiblePart +=
            this.originalText[i] === " "
              ? " "
              : this.chars[Math.floor(Math.random() * this.chars.length)];
        } else {
          hiddenPart += this.originalText[i];
        }
      }
      this.el.innerHTML =
        visiblePart + `<span style="opacity: 0">${hiddenPart}</span>`;
      iteration += 1 / 2;
      if (iteration >= this.originalText.length) {
        clearInterval(this.interval);
        this.el.textContent = this.originalText;
        this.isScrambling = false;
      }
    }, 30);
  }
}

setTimeout(() => {
  document.querySelectorAll("#stage-hero h1, #stage-hero h2, #stage-hero p").forEach((el) => {
    new ScrambleText(el).start();
  });
}, 200);

function wrapLetters3D(el, textContent) {
  const text = (textContent !== undefined ? textContent : el.textContent).trim();
  el.innerHTML = "";
  let globalIndex = 0;
  
  // Group characters into words to prevent breaking
  const words = text.split(" ");
  words.forEach((word, wordIdx) => {
    const wordSpan = document.createElement("span");
    wordSpan.style.display = "inline-block";
    wordSpan.style.whiteSpace = "nowrap";
    
    word.split("").forEach((char) => {
      const wrapper = document.createElement("span");
      wrapper.className = "letter-3d-wrapper";
      wrapper.style.transitionDelay = `${globalIndex * 0.03}s`;
      
      const front = document.createElement("span");
      front.className = "letter-3d-front";
      front.textContent = char;
      
      const bottom = document.createElement("span");
      bottom.className = "letter-3d-bottom";
      bottom.textContent = char;
      
      wrapper.appendChild(front);
      wrapper.appendChild(bottom);
      wordSpan.appendChild(wrapper);
      
      globalIndex++;
    });
    
    el.appendChild(wordSpan);
    
    // Add spacing between words
    if (wordIdx < words.length - 1) {
      const spaceWrapper = document.createElement("span");
      spaceWrapper.className = "letter-3d-wrapper";
      spaceWrapper.style.transitionDelay = `${globalIndex * 0.03}s`;
      
      const front = document.createElement("span");
      front.className = "letter-3d-front";
      front.textContent = "\u00A0";
      
      const bottom = document.createElement("span");
      bottom.className = "letter-3d-bottom";
      bottom.textContent = "\u00A0";
      
      spaceWrapper.appendChild(front);
      spaceWrapper.appendChild(bottom);
      el.appendChild(spaceWrapper);
      
      globalIndex++;
    }
  });
}

document.querySelectorAll(".projects .name").forEach((el) => {
  wrapLetters3D(el);
});



const themeToggle = document.getElementById("themeToggle");
const transCanvas = document.getElementById("pixel-transition");
const transCtx = transCanvas.getContext("2d");
let currentTheme = "light";
let trailTheme = "light";
try {
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || (!saved && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    currentTheme = "dark";
    trailTheme = "dark";
    document.documentElement.setAttribute("data-theme", "dark");
  }
} catch (_) {}

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

function updateThemeIcon() {
  themeToggle.innerHTML = currentTheme === "light" ? svgMoon : svgSun;
}

updateThemeIcon();

let isTransitioning = false;
themeToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  if (isTransitioning) return;
  isTransitioning = true;
  const newTheme = currentTheme === "light" ? "dark" : "light";
  trailTheme = newTheme;
  currentTheme = newTheme;
  try {
    localStorage.setItem("theme", newTheme);
  } catch (_) {}
  updateThemeIcon();
  
  const newBgColor = newTheme === "dark" ? "#121212" : "#e3ecd7";
  const metaTheme = document.getElementById("meta-theme-color");
  if (metaTheme) metaTheme.setAttribute("content", newBgColor);
  
  transCanvas.width = window.innerWidth;
  transCanvas.height = window.innerHeight;
  transCanvas.classList.add("active");
  document.body.classList.add("is-transitioning");
  
  const elementsToFlip = document.querySelectorAll(
    '.theme-toggle, .top-nav, .nav-blog-btn, .nav-blog-text, h1, h2, .letter-3d-wrapper, p, li, .sq, .name, .desc, .socials a img, .spotify-widget, .github-status, .visit-counter, .visit-digit, .education-card, .education-section, .contact-email, .btn, .blog-all-btn, .native-arrow, .link-arrow, .modal-link-text, .contact-form, .contact-form input, .contact-form textarea, .modal-content, .modal-close, code, .menu-col, .projects, .mascot, .mascot-bubble, .mascot-bubble a, .heat-cell, .term-title, .term-close, .term-line, .term-prompt, .term-input, .term-ghost'
  );
  
  const ditherBandRatio = 1 / 1.5;
  const flips = Array.from(elementsToFlip).map(el => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const d = Math.sqrt((window.innerWidth - cx)**2 + cy**2);
    return { el, d, lag: ditherBandRatio, flipped: false };
  });

  // Split hero text into letters so each one flips as the wave reaches it
  const splitEls = [];
  if (document.getElementById("stage-hero").classList.contains("active")) {
    document.querySelectorAll("#stage-hero h1, #stage-hero p").forEach((el) => {
      if (el.querySelector(".letter-3d-wrapper")) return;
      const text = el.dataset.original || el.textContent;
      el.textContent = "";
      for (const ch of text) {
        const span = document.createElement("span");
        span.textContent = ch;
        el.appendChild(span);
        const rect = span.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const d = Math.sqrt((window.innerWidth - cx)**2 + cy**2);
        flips.push({ el: span, d, lag: 0.25, flipped: false });
      }
      splitEls.push({ el, text });
    });
  }

  const size = window.innerWidth > 768 ? 30 : 20;
  const cols = Math.ceil(window.innerWidth / size);
  const rows = Math.ceil(window.innerHeight / size);
  const maxR = Math.sqrt(cols * cols + rows * rows);
  
  const bayer = [
    [ 0,  8,  2, 10],
    [12,  4, 14,  6],
    [ 3, 11,  1,  9],
    [15,  7, 13,  5]
  ];
  const ditherBand = 12;
  
  const duration = 800;
  let startTime = null;
  const targetTextColor = newTheme === "dark" ? "#8fbc8b" : "#1c2e1c";
  const targetLogoFilter = newTheme === "dark"
    ? "brightness(0) invert(81%) sepia(23%) saturate(440%) hue-rotate(68deg) brightness(82%) contrast(91%)"
    : "brightness(0) invert(10%) sepia(100%) saturate(150%) hue-rotate(72deg) brightness(130%)";
  
  // The terminal pop-up has an opaque background, so it paints the old and new colours in two layers (see terminal.css)
  const termDrawer = document.getElementById("term");
  document.documentElement.style.setProperty("--tr-old-bg", newTheme === "dark" ? "#e3ecd7" : "#121212");
  document.documentElement.style.setProperty("--tr-new-bg", newBgColor);
  document.documentElement.style.setProperty("--tr-old-fg", newTheme === "dark" ? "#1c2e1c" : "#8fbc8b");
  document.documentElement.style.setProperty("--tr-new-fg", targetTextColor);

  function animateSweep(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1.0);
    // EaseOutQuad for smooth deceleration
    const easeProgress = 1 - (1 - progress) * (1 - progress);
    // Calculate wave radius
    let waveR = -ditherBand + (Math.sqrt(cols * cols + rows * rows) + ditherBand * 2) * easeProgress;
    
    // Draw dither pattern to canvas
    transCtx.clearRect(0, 0, transCanvas.width, transCanvas.height);
    transCtx.fillStyle = newBgColor;
    
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const cols_dist = cols - x;
        const d = Math.sqrt(cols_dist * cols_dist + y * y);
        let threshold = (waveR - d) / ditherBand;
        
        if (threshold > 0) {
          const b = bayer[y % 4][x % 4] / 16;
          if (threshold >= 1.0 || threshold > b) {
            // Draw slightly larger to prevent subpixel gaps
            transCtx.fillRect(x * size - 0.5, y * size - 0.5, size + 1, size + 1);
          }
        }
      }
    }
    
    if (termDrawer) {
      const r = termDrawer.getBoundingClientRect();
      termDrawer.style.setProperty("--wave-r", Math.max(0, waveR - ditherBand * 0.5) * size + "px");
      termDrawer.style.setProperty("--wave-x", cols * size - r.left + "px");
      termDrawer.style.setProperty("--wave-y", -r.top + "px");
    }

    // Flip individual elements as wave passes
    for (let flip of flips) {
      if (!flip.flipped && (waveR - ditherBand * flip.lag) > flip.d / size) {
        flip.el.setAttribute("data-theme", newTheme);
        flip.el.style.color = targetTextColor;
        if (flip.el.matches('.education-card, .mascot-bubble, .btn, .modal-content, .contact-form input, .contact-form textarea, .menu-col, .projects li, .blog-all-btn, .visit-digit')) {
          flip.el.style.borderColor = targetTextColor;
        }
        if (flip.el.tagName.toLowerCase() === "img") {
          flip.el.style.filter = targetLogoFilter;
        }
        flip.flipped = true;
      }
    }
    
    if (progress < 1.0) {
      requestAnimationFrame(animateSweep);
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
      
      // Cleanup
      document.documentElement.style.removeProperty("--tr-old-bg");
      document.documentElement.style.removeProperty("--tr-new-bg");
      document.documentElement.style.removeProperty("--tr-old-fg");
      document.documentElement.style.removeProperty("--tr-new-fg");
      if (termDrawer) {
        for (const name of ["--wave-r", "--wave-x", "--wave-y"]) termDrawer.style.removeProperty(name);
      }
      for (let flip of flips) {
        flip.el.removeAttribute("data-theme");
        flip.el.style.color = "";
        flip.el.style.borderColor = "";
        if (flip.el.tagName.toLowerCase() === "img") {
          flip.el.style.filter = "";
        }
      }
      
      for (const { el, text } of splitEls) {
        el.textContent = text;
      }

      transCanvas.classList.remove("active");
      transCtx.clearRect(0, 0, transCanvas.width, transCanvas.height);
      document.body.classList.remove("is-transitioning");
      isTransitioning = false;
    }
  }
  requestAnimationFrame(animateSweep);
});


// Spotify Integration
const spotifyWidget = document.getElementById("spotifyWidget");
const spotifyTrack = document.getElementById("spotifyTrack");
const spotifyLink = document.getElementById("spotifyLink");

// Grow the mobile bottom fade only by the widget's extra height
function updateMenuFade() {
  const extra = spotifyWidget.classList.contains("active")
    ? Math.max(0, spotifyWidget.offsetHeight - 50)
    : 0;
  menuStage.style.setProperty("--fade-bottom", `${extra}px`);
}
new ResizeObserver(updateMenuFade).observe(spotifyWidget);
new MutationObserver(updateMenuFade).observe(spotifyWidget, { attributes: true, attributeFilter: ["class"] });

let localProgressMs = 0;
let localDurationMs = 0;
let isPlayingLocal = false;
let localTimerInterval = null;

function formatSpotifyTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateLocalTimeUI() {
  const spotifyTime = document.getElementById("spotifyTime");
  const spotifyProgressBar = document.getElementById("spotifyProgressBar");
  
  if (spotifyTime && isPlayingLocal && localDurationMs > 0) {
        // Cap progress at total duration
    const safeProgress = Math.min(localProgressMs, localDurationMs);
    spotifyTime.textContent = `${formatSpotifyTime(safeProgress)} / ${formatSpotifyTime(localDurationMs)}`;
    
        // Update visual progress bar
    if (spotifyProgressBar) {
      const percentage = (safeProgress / localDurationMs) * 100;
      const currentWidth = parseFloat(spotifyProgressBar.style.width) || 0;
      
            // Remove animation when restarting or skipping
      if (percentage < currentWidth || percentage === 0) {
        spotifyProgressBar.style.transition = "none";
        spotifyProgressBar.style.width = `${percentage}%`;
        
                // Force reflow for instant change
        void spotifyProgressBar.offsetWidth;
        
                // Restore animation
        setTimeout(() => {
          spotifyProgressBar.style.transition = "width 1s linear";
        }, 50);
      } else {
        spotifyProgressBar.style.width = `${percentage}%`;
      }
    }
  }
}
let currentSpotifyUri = null;

async function fetchSpotifyCurrentlyPlaying() {
  try {
    const res = await fetch("/api/spotify");
    
    if (res.ok) {
      const data = await res.json();
      const spotifyLabel = document.querySelector(".spotify-label");
      const spotifyTime = document.getElementById("spotifyTime");
      const progressWrapper = document.querySelector(".spotify-progress-wrapper");
      
      if (data.is_playing) {
        spotifyLabel.textContent = "coto tá ouvindo agora";
        if (progressWrapper) progressWrapper.style.display = "block";
        
                // Sync local clock with API data
        if (data.progress_ms && data.duration_ms) {
          localProgressMs = data.progress_ms;
          localDurationMs = data.duration_ms;
          isPlayingLocal = true;
          updateLocalTimeUI();
          
                    // Start local timer if stopped
          if (!localTimerInterval) {
            localTimerInterval = setInterval(() => {
              if (isPlayingLocal && localProgressMs < localDurationMs) {
                localProgressMs += 1000;
                updateLocalTimeUI();
              }
            }, 1000);
          }
        }
        const text = `${data.artist} - ${data.title}`.toLowerCase();
        
                // Update text and animation only on song change
        if (spotifyTrack.textContent !== text) {
          spotifyTrack.textContent = text;
          
                    // Check for scrolling text
          setTimeout(() => {
            const info = spotifyTrack.parentElement;
            
                        // Clear previous animations
            if (spotifyTrack.scrollAnim) {
              spotifyTrack.scrollAnim.cancel();
            }
            
                        // Validate scrolling requirement
            if (spotifyTrack.scrollWidth > info.clientWidth) {
              const dist = spotifyTrack.scrollWidth - info.clientWidth;
                            // Calculate dynamic animation duration
              const duration = Math.min(Math.max(3000, dist * 40), 15000); 
              
              spotifyTrack.scrollAnim = spotifyTrack.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(0)', offset: 0.10 },
                { transform: `translateX(-${dist}px)`, offset: 0.90 },
                { transform: `translateX(-${dist}px)` }
              ], {
                duration: duration,
                iterations: Infinity,
                direction: 'alternate',
                easing: 'ease-in-out'
              });
            }
          }, 100);
        }
        
        currentSpotifyUri = data.uri;
        spotifyLink.href = data.songUrl;
        spotifyLink.style.pointerEvents = "auto";
        if (document.getElementById("listenAlongBtn")) {
          const listenBtn = document.getElementById("listenAlongBtn");
          listenBtn.href = data.songUrl;
          listenBtn.style.display = "";
        }
        spotifyWidget.classList.remove("hide");
        spotifyWidget.classList.add("active");
        spotifyWidget.classList.add("is-playing");
      } else {
        spotifyLabel.textContent = "coto tá ouvindo";
        if (spotifyTime) spotifyTime.textContent = "";
        if (progressWrapper) progressWrapper.classList.remove("is-playing");
                // Pause local timer
        isPlayingLocal = false;
        if (localTimerInterval) {
          clearInterval(localTimerInterval);
          localTimerInterval = null;
        }
        if (spotifyTrack.textContent !== "nada no momento :c") {
          spotifyTrack.textContent = "nada no momento :c";
          if (spotifyTrack.scrollAnim) {
            spotifyTrack.scrollAnim.cancel();
          }
        }
        spotifyLink.href = "#";
        spotifyLink.style.pointerEvents = "none";
        if (document.getElementById("listenAlongBtn")) {
          document.getElementById("listenAlongBtn").style.display = "";
        }
        spotifyWidget.classList.remove("is-playing");
        spotifyWidget.classList.remove("hide");
        spotifyWidget.classList.add("active");
      }
    } else {
      spotifyLabel.textContent = "coto tá ouvindo";
      if (spotifyTime) spotifyTime.textContent = "";
      if (spotifyTrack.textContent !== "nada no momento :c") {
        spotifyTrack.textContent = "nada no momento :c";
        if (spotifyTrack.scrollAnim) {
          spotifyTrack.scrollAnim.cancel();
        }
      }
      spotifyLink.href = "#";
      spotifyLink.style.pointerEvents = "none";
      if (document.getElementById("listenAlongBtn")) {
        document.getElementById("listenAlongBtn").style.display = "";
      }
      spotifyWidget.classList.remove("is-playing");
      spotifyWidget.classList.remove("hide");
      spotifyWidget.classList.add("active");
    }
  } catch (error) {
    console.error("Erro ao buscar dados do Spotify:", error);
  }
}

fetchSpotifyCurrentlyPlaying();
setInterval(fetchSpotifyCurrentlyPlaying, 2500);

// Notification System
let notificationTimeout;
function showNotification(msg) {
  const notifEl = document.getElementById("customNotification");
  if (!notifEl) return;
  notifEl.innerHTML = "";
  notifEl.className = "custom-notification show";
  
  // Create text container (invisible, used to establish dimensions)
  const textEl = document.createElement("div");
  textEl.className = "tetris-msg";
  textEl.textContent = msg.toLowerCase();
  notifEl.appendChild(textEl);
  
  // Create falling blocks with clip-path masking
  const numBlocks = 5;
  for (let i = 0; i < numBlocks; i++) {
    const block = document.createElement("div");
    block.className = "tetris-chunk";
    block.textContent = msg.toLowerCase();
    
    // Set clip path: inset(top right bottom left)
    const leftPercent = i * 20;
    const rightPercent = 100 - (i + 1) * 20;
    
    // Add a 1px overlap on inner edges to prevent subpixel anti-aliasing gaps
    let leftInset = `${leftPercent}%`;
    let rightInset = `${rightPercent}%`;
    
    if (i > 0) leftInset = `calc(${leftPercent}% - 1px)`;
    if (i < numBlocks - 1) rightInset = `calc(${rightPercent}% - 1px)`;
    
    block.style.clipPath = `inset(0 ${rightInset} 0 ${leftInset})`;
    block.style.webkitClipPath = `inset(0 ${rightInset} 0 ${leftInset})`;
    
    // Center-last falling pattern
    const distFromCenter = Math.abs(i - 2);
    const delay = (2 - distFromCenter) * 0.1;
    block.style.setProperty('--delay-in', `${delay}s`);
    block.style.setProperty('--delay-out', `${0.2 - delay}s`);
    
    notifEl.appendChild(block);
  }
  
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notifEl.classList.remove("show");
    notifEl.classList.add("hide");
    setTimeout(() => {
      notifEl.innerHTML = "";
      notifEl.classList.remove("hide");
    }, 700);
  }, 4000);
}

// Spotify Listen Along
async function handleSpotifyAuthCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  
  if (error) {
    showNotification("Erro na conexão com Spotify: " + error);
    const url = new URL(window.location);
    url.searchParams.delete("error");
    window.history.replaceState({}, document.title, url.pathname + url.search);
    return;
  }
  
  if (code) {
    try {
            // Fetch redirect URI from backend
      const resId = await fetch("/api/spotify-client-id");
      const dataId = await resId.json();
      const redirectUri = dataId.redirectUri || "https://cotoo.dev";
      
      const res = await fetch("/api/spotify-exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code, redirect_uri: redirectUri })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("visitor_spotify_token", data.access_token);
        localStorage.setItem("visitor_spotify_expires", Date.now() + (parseInt(data.expires_in) * 1000));
        
                // Clean URL parameters
        const url = new URL(window.location);
        url.searchParams.delete("code");
        window.history.replaceState({}, document.title, url.pathname + url.search);
        
        showNotification("Spotify conectado com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao trocar o código:", err);
      showNotification("Erro ao conectar com Spotify.");
    }
  }
}
handleSpotifyAuthCode();

const listenAlongBtn = document.getElementById("listenAlongBtn");
if (listenAlongBtn) {
  listenAlongBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentSpotifyUri) return;
    
    const token = localStorage.getItem("visitor_spotify_token");
    const expires = localStorage.getItem("visitor_spotify_expires");
    
    if (token && expires && Date.now() < parseInt(expires)) {
            // Sync with valid token
      try {
        listenAlongBtn.textContent = "sincronizando...";
        const res = await fetch("https://api.spotify.com/v1/me/player/play", {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uris: [currentSpotifyUri],
            position_ms: localProgressMs
          })
        });
        
        if (res.ok || res.status === 204) {
          listenAlongBtn.textContent = "sincronizado!";
          showNotification("sincronizado!");
          setTimeout(() => { listenAlongBtn.textContent = "ouvir com o coto"; }, 3000);
        } else {
          const text = await res.text();
          let data = {};
          try {
            data = JSON.parse(text);
          } catch(e) {}
          
          if (res.status === 403) {
            showNotification("o spotify exige conta premium para isso :c");
            listenAlongBtn.textContent = "ouvir com o coto";
          } else if (data.error && data.error.reason === "NO_ACTIVE_DEVICE") {
            showNotification("abra o Spotify e dê play em algo primeiro!");
            listenAlongBtn.textContent = "ouvir com o coto";
          } else if (res.status === 401) {
            throw new Error("Token expirado ou revogado");
          } else {
            console.error("Erro da API:", text);
            showNotification("erro. verifique se o Spotify está aberto.");
            listenAlongBtn.textContent = "ouvir com o coto";
          }
        }
      } catch (err) {
        console.error("Erro ao sincronizar:", err);
        if (err.message === "Token expirado ou revogado") {
          localStorage.removeItem("visitor_spotify_token");
          listenAlongBtn.textContent = "ouvir com o coto";
          showNotification("Sessão expirada. Por favor, conecte de novo.");
        } else {
          listenAlongBtn.textContent = "ouvir com o coto";
          showNotification("Falha na sincronização.");
        }
      }
    } else {
            // Authenticate if token is invalid
      try {
        listenAlongBtn.textContent = "conectando...";
        const res = await fetch("/api/spotify-client-id");
        const data = await res.json();
        const clientId = data.clientId;
        
                // Get redirect URI
        const redirectUri = data.redirectUri || "https://cotoo.dev";
        const scopes = "user-modify-playback-state";
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
        
        window.location.href = authUrl;
      } catch (err) {
        console.error("Erro ao buscar client id:", err);
        listenAlongBtn.textContent = "ouvir com o coto";
      }
    }
  });
}

if (spotifyWidget) {
  spotifyWidget.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

// GitHub Integration
function revealStatus(el, text) {
  // Fade out the loading dots, then wipe the result in from the right
  el.classList.add("leaving");
  setTimeout(() => {
    el.classList.remove("loading", "leaving");
    el.textContent = text;
    el.classList.add("reveal");
  }, 250);
}

async function fetchGithubActivity() {
  const el = document.getElementById("githubStatus");
  if (!el) return;
  const startedAt = Date.now();

  try {
    const res = await fetch("/api/github");
    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    // Let the loading dots play for a moment before revealing the result
    const wait = Math.max(0, 900 - (Date.now() - startedAt));
    await new Promise((r) => setTimeout(r, wait));

    if (data.found) {
      const date = new Date(data.created_at);
      const diff = Math.floor((new Date() - date) / 60000);

      if (diff === 0) {
        revealStatus(el, `último commit: agora mesmo`);
      } else {
        let timeStr = "";
        if (diff < 60) timeStr = `${diff}m`;
        else if (diff < 1440) timeStr = `${Math.floor(diff / 60)}h`;
        else timeStr = `${Math.floor(diff / 1440)}d`;

        revealStatus(el, `último commit: ${timeStr} atrás`);
      }
    } else {
      el.style.display = "none";
    }
  } catch (err) {
    el.style.display = "none";
  }
}
fetchGithubActivity();

// Confetti Effect
function firePixelConfetti() {
  const colors = currentTheme === "dark" ? ["#8FBC8B", "#ffffff", "#444444"] : ["#4D9A4D", "#1C2E1C", "#8FBC8B"];
  const isMobile = window.innerWidth < 600;
  const count = isMobile ? 80 : 150;
  
    // Glitch Effect
  document.body.style.transition = "none";
  document.body.style.filter = "invert(100%) contrast(150%)";
  setTimeout(() => document.body.style.filter = "none", 50);
  setTimeout(() => document.body.style.filter = "invert(100%) contrast(150%)", 100);
  setTimeout(() => document.body.style.filter = "none", 150);
  
  for (let i = 0; i < count; i++) {
    const confetti = document.createElement("div");
    confetti.style.position = "fixed";
    const size = Math.random() > 0.5 ? "10px" : "16px";
    confetti.style.width = size;
    confetti.style.height = size;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = "50%";
    confetti.style.top = "50%";
    confetti.style.zIndex = 100000;
    confetti.style.pointerEvents = "none";
        // Retro box shadow
    confetti.style.boxShadow = "2px 2px 0px rgba(0,0,0,0.5)";
    document.body.appendChild(confetti);

    const angle = Math.random() * Math.PI * 2;
    const velocity = 8 + Math.random() * 25;
    let vx = Math.cos(angle) * velocity;
    let vy = Math.sin(angle) * velocity - 15;
    
    let x = 0;
    let y = 0;
    let currentVy = vy;
    let rotation = 0;
    let rotSpeed = (Math.random() - 0.5) * 30;
    let bounces = 0;
    
    function animateConfetti() {
      x += vx;
      y += currentVy;
      currentVy += 0.8;
      rotation += rotSpeed;
      
            // Floor bounce
      const bottomLimit = window.innerHeight / 2 - 20;
      if (y > bottomLimit) {
        y = bottomLimit;
        currentVy = -currentVy * 0.5;
        vx *= 0.8;
        bounces++;
      }
      
      confetti.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      
            // Remove after momentum loss
      if (bounces < 3 || Math.abs(currentVy) > 1) {
        requestAnimationFrame(animateConfetti);
      } else {
                // Fade out
        confetti.style.transition = "opacity 0.5s";
        confetti.style.opacity = "0";
        setTimeout(() => confetti.remove(), 500);
      }
    }
    requestAnimationFrame(animateConfetti);
  }
}

// Visit Counter
async function registerVisit() {
  const el = document.getElementById("visitCounter");
  const box = document.getElementById("visitDigits");
  if (!el || !box) return;

  const MIN_DIGITS = 5;
  const makeDigits = (n) => {
    box.innerHTML = "";
    return Array.from({ length: n }, () => {
      const d = document.createElement("span");
      d.className = "visit-digit rolling";
      d.textContent = "0";
      box.appendChild(d);
      return d;
    });
  };

  // Slot-machine roll while waiting for the API
  let digits = makeDigits(MIN_DIGITS);
  el.hidden = false;
  const roll = setInterval(() => {
    digits.forEach((d) => {
      if (d.classList.contains("rolling")) d.textContent = Math.floor(Math.random() * 10);
    });
  }, 70);
  const startedAt = Date.now();

  try {
    // Count once per browser session
    const counted = sessionStorage.getItem("visitCounted");
    const res = await fetch("/api/visits", { method: counted ? "GET" : "POST" });
    if (!res.ok) throw new Error("API error");

    const { visits } = await res.json();
    sessionStorage.setItem("visitCounted", "1");

    // Keep the roll visible for a minimum time so it never just pops in
    const wait = Math.max(0, 700 - (Date.now() - startedAt));
    await new Promise((r) => setTimeout(r, wait));

    const text = String(visits).padStart(MIN_DIGITS, "0");
    if (text.length !== digits.length) digits = makeDigits(text.length);
    el.title = `${visits.toLocaleString("pt-BR")} visitas`;

    // Lock digits one by one, left to right
    digits.forEach((d, i) => {
      setTimeout(() => {
        d.textContent = text[i];
        d.classList.remove("rolling");
        d.classList.add("locked");
        if (i === digits.length - 1) clearInterval(roll);
      }, i * 120);
    });
  } catch (err) {
    clearInterval(roll);
    el.hidden = true;
  }
}
registerVisit();

// Dynamic latest blog post loader
async function initLatestBlogPost() {
  const blogList = document.getElementById("blogList");
  if (!blogList) return;

  try {
    const res = await fetch("/api/blog?format=json");
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.latest) {
      const p = data.latest;
      const li = blogList.querySelector("li");
      if (li) {
        li.setAttribute("data-url", `/blog/${p.slug}/`);
        const nameEl = li.querySelector(".name");
        const descEl = li.querySelector(".desc");
        if (nameEl) {
          wrapLetters3D(nameEl, p.meta.shortTitle || p.meta.title);
        }
        if (descEl) descEl.textContent = p.meta.description;
      }
    }
  } catch (_) {
    // Graceful fallback to static markup
  }
}
initLatestBlogPost();

// Instant blog prefetching on link hover / focus
(function initBlogPrefetch() {
  function prefetchUrl(url) {
    if (!url || document.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
  }

  const blogLinks = document.querySelectorAll('#navBlogBtn, .blog-all-btn, #blogList li');
  blogLinks.forEach((el) => {
    el.addEventListener(
      "mouseenter",
      () => {
        const target = el.getAttribute("data-url") || el.getAttribute("href") || "/blog/";
        prefetchUrl(target);
      },
      { once: true, passive: true }
    );
    el.addEventListener(
      "focus",
      () => {
        const target = el.getAttribute("data-url") || el.getAttribute("href") || "/blog/";
        prefetchUrl(target);
      },
      { once: true, passive: true }
    );
  });

  const navBlogBtn = document.getElementById("navBlogBtn");
  if (navBlogBtn) {
    navBlogBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
        return;
      }
      e.preventDefault();
      window.location.href = navBlogBtn.getAttribute("href") || "/blog/";
    });
    navBlogBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
    navBlogBtn.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  }
})();


