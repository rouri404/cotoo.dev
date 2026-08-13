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
  ctx.fillStyle = currentTheme === "dark" ? "#8FBC8B" : "#ffffff";
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
  const col = Math.floor(e.clientX / pixelSize);
  const row = Math.floor(e.clientY / pixelSize);
  const key = `${col},${row}`;
  activePixels.set(key, performance.now());
}

const heroStage = document.getElementById("stage-hero");
const menuStage = document.getElementById("stage-menu");

function goToMenu() {
  if (document.body.dataset.stage === "menu") return;
  document.body.dataset.stage = "menu";
  heroStage.classList.remove("active");
  menuStage.classList.add("active");
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
  if (document.body.dataset.stage === "hero") goToMenu();
});

window.addEventListener(
  "wheel",
  (e) => {
    if (e.deltaY > 20) goToMenu();
    else if (e.deltaY < -20) goToHero();
  },
  { passive: true },
);

window.addEventListener("keydown", (e) => {
  if (["Enter", " ", "ArrowDown", "PageDown"].includes(e.key)) goToMenu();
  if (["Escape", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) goToHero();
});

document.querySelectorAll(".projects li").forEach((li) => {
  li.addEventListener("click", (e) => {
    e.stopPropagation();
    const url = li.getAttribute("data-url");
    if (url) window.open(url, "_blank", "noopener");
  });
  li.addEventListener("keydown", (e) => {
    if (e.key === "Enter") li.click();
  });
});

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
  document.querySelectorAll("#stage-hero h2, #stage-hero p").forEach((el) => {
    new ScrambleText(el).start();
  });
}, 200);

document.querySelectorAll(".projects .name").forEach((el) => {
  const text = el.textContent.trim();
  el.innerHTML = "";
  text.split("").forEach((char, i) => {
    const wrapper = document.createElement("span");
    wrapper.className = "letter-3d-wrapper";
    wrapper.style.transitionDelay = `${i * 0.03}s`;
    const front = document.createElement("span");
    front.className = "letter-3d-front";
    front.textContent = char === " " ? "\u00A0" : char;
    const bottom = document.createElement("span");
    bottom.className = "letter-3d-bottom";
    bottom.textContent = char === " " ? "\u00A0" : char;
    wrapper.appendChild(front);
    wrapper.appendChild(bottom);
    el.appendChild(wrapper);
  });
});



const themeToggle = document.getElementById("themeToggle");
const transCanvas = document.getElementById("pixel-transition");
const transCtx = transCanvas.getContext("2d");
let currentTheme = "light";
if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  currentTheme = "dark";
  document.body.setAttribute("data-theme", "dark");
}

const svgSun = `<svg viewBox="0 0 12 12" style="width:24px; height:24px; display:block;" fill="currentColor" shape-rendering="crispEdges">
  <rect x="5" y="1" width="2" height="2" />
  <rect x="3" y="3" width="1" height="1" />
  <rect x="8" y="3" width="1" height="1" />
  <rect x="5" y="4" width="2" height="1" />
  <rect x="1" y="5" width="2" height="2" />
  <rect x="4" y="5" width="4" height="2" />
  <rect x="9" y="5" width="2" height="2" />
  <rect x="5" y="7" width="2" height="1" />
  <rect x="3" y="8" width="1" height="1" />
  <rect x="8" y="8" width="1" height="1" />
  <rect x="5" y="9" width="2" height="2" />
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
  const clone = document.createElement("div");
  clone.innerHTML = document.body.innerHTML;
  clone.querySelector("#pixel-trail")?.remove();
  clone.querySelector("#pixel-transition")?.remove();
  clone.querySelector("#themeToggle")?.remove();
  const svgNS = "http://www.w3.org/2000/svg";
  const maskSvg = document.createElementNS(svgNS, "svg");
  maskSvg.style.position = "absolute";
  maskSvg.style.width = "0";
  maskSvg.style.height = "0";
  const defs = document.createElementNS(svgNS, "defs");
  const mask = document.createElementNS(svgNS, "mask");
  mask.id = "pixel-mask-dyn";
  defs.appendChild(mask);
  maskSvg.appendChild(defs);
  document.body.appendChild(maskSvg);
  const themeReveal = document.createElement("div");
  themeReveal.style.position = "fixed";
  themeReveal.style.inset = "0";
  themeReveal.style.zIndex = "9998";
  themeReveal.style.pointerEvents = "none";
  themeReveal.style.backgroundColor = "var(--bg-color)";
  themeReveal.style.color = "var(--text-color)";
  themeReveal.style.webkitMask = "url(#pixel-mask-dyn)";
  themeReveal.style.mask = "url(#pixel-mask-dyn)";
  themeReveal.setAttribute("data-theme", newTheme);
  themeReveal.appendChild(clone);
  document.body.appendChild(themeReveal);
  const size = window.innerWidth > 768 ? 40 : 25;
  const cols = Math.ceil(window.innerWidth / size);
  const rows = Math.ceil(window.innerHeight / size);
  const grid = new Array(cols * rows).fill(false);
  let waveR = -5;
  const maxR = Math.sqrt(cols * cols + rows * rows);
  const waveSpeed = maxR / 35;
  function animateSweep() {
    let finished = true;
    const frag = document.createDocumentFragment();
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const idx = x + y * cols;
        if (!grid[idx]) {
          const d = Math.sqrt((cols - x) ** 2 + (0 - y) ** 2);
          const dist = waveR - d;
          if (dist > 0) {
            const chance = dist / 12;
            if (Math.random() < chance) {
              grid[idx] = true;
              const rect = document.createElementNS(svgNS, "rect");
              rect.setAttribute("x", x * size);
              rect.setAttribute("y", y * size);
              rect.setAttribute("width", size + 1.5);
              rect.setAttribute("height", size + 1.5);
              rect.setAttribute("fill", "white");
              frag.appendChild(rect);
            }
          }
          if (!grid[idx]) {
            finished = false;
          }
        }
      }
    }
    mask.appendChild(frag);
    waveR += waveSpeed;
    if (!finished) {
      requestAnimationFrame(animateSweep);
    } else {
      document.body.setAttribute("data-theme", newTheme);
      currentTheme = newTheme;
      updateThemeIcon();
      themeReveal.remove();
      maskSvg.remove();
      isTransitioning = false;
    }
  }
  animateSweep();
});

// Smooth exit for infinite wobble on socials
document.querySelectorAll('.socials a').forEach(el => {
    el.addEventListener('mouseenter', () => {
        el.style.transition = ''; 
        el.style.transform = ''; 
        el.classList.add('is-wobbling');
    });

    el.addEventListener('mouseleave', () => {
        // Obter o grau de inclinação exato no instante em que o mouse sai
        const computedStyle = window.getComputedStyle(el);
        const transform = computedStyle.getPropertyValue('transform');
        
        // Remove a classe infinita e "trava" o transform na posição que estava
        el.classList.remove('is-wobbling');
        el.style.transform = transform;
        
        // Força o navegador a renderizar o quadro atual travado
        void el.offsetWidth;
        
        // Ativa a transição suave e manda ele de volta pro zero!
        el.style.transition = 'transform 0.4s ease-out';
        el.style.transform = 'rotate(0deg)';
    });
    
    // Suporte para navegação via teclado
    el.addEventListener('focus', () => {
        el.style.transition = ''; 
        el.style.transform = ''; 
        el.classList.add('is-wobbling');
    });
    el.addEventListener('blur', () => {
        el.classList.remove('is-wobbling');
        el.style.transition = 'transform 0.4s ease-out';
        el.style.transform = 'rotate(0deg)';
    });
});
