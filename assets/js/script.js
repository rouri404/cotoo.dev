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
  ctx.fillStyle = trailTheme === "dark" ? "#8FBC8B" : "#ffffff";
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
  if (document.body.dataset.stage === "hero") {
    goToMenu();
  } else {
    goToHero();
  }
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
    
    // Força o efeito hover (o flip 3D) a aparecer e ficar "travado"
    li.classList.add("is-clicked");
    
    // Espera 400ms (tempo suficiente para o usuário ver o flip de 0.5s) antes de abrir a aba
    setTimeout(() => {
      if (url) window.open(url, "_blank", "noopener");
      // Reseta o estado depois de abrir
      setTimeout(() => li.classList.remove("is-clicked"), 100);
    }, 400);
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
let trailTheme = "light";
if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  currentTheme = "dark";
  trailTheme = "dark";
  document.documentElement.setAttribute("data-theme", "dark");
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
  trailTheme = newTheme;
  currentTheme = newTheme;
  updateThemeIcon();
  
  const newBgColor = newTheme === "dark" ? "#121212" : "#8fbc8b";
  
  transCanvas.width = window.innerWidth;
  transCanvas.height = window.innerHeight;
  transCanvas.classList.add("active");
  
  const elementsToFlip = document.querySelectorAll(
    '.theme-toggle, h2, .letter-3d-wrapper, p, li, .sq, .name, .desc, .socials a img, .spotify-widget'
  );
  
  const flips = Array.from(elementsToFlip).map(el => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const d = Math.sqrt((window.innerWidth - cx)**2 + cy**2);
    return { el, d, flipped: false };
  });

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
  const ditherBand = 12; // width of dither transition in grid cells
  
  const duration = 1200; // ms for the entire sweep
  let startTime = null;
  
  function animateSweep(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1.0);
    // EaseOutQuad for a smooth deceleration
    const easeProgress = 1 - (1 - progress) * (1 - progress);
    // Calculate the wave radius
    let waveR = -ditherBand + (Math.sqrt(cols * cols + rows * rows) + ditherBand * 2) * easeProgress;
    
    // Draw the dither pattern to canvas
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
    
    // Flip individual elements as wave passes over them
    for (let flip of flips) {
      // Flip when the wave is dense enough (ditherBand / 1.5) to hide the instant color swap
      if (!flip.flipped && (waveR - ditherBand / 1.5) > flip.d / size) {
        flip.el.setAttribute("data-theme", newTheme);
        flip.el.style.color = "var(--text-color)";
        if (flip.el.tagName.toLowerCase() === "img") {
          flip.el.style.filter = "var(--logo-filter)";
        }
        flip.flipped = true;
      }
    }
    
    if (progress < 1.0) {
      requestAnimationFrame(animateSweep);
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
      
      // Cleanup
      for (let flip of flips) {
        flip.el.removeAttribute("data-theme");
        flip.el.style.color = "";
        if (flip.el.tagName.toLowerCase() === "img") {
          flip.el.style.filter = "";
        }
      }
      
      transCanvas.classList.remove("active");
      transCtx.clearRect(0, 0, transCanvas.width, transCanvas.height);
      isTransitioning = false;
    }
  }
  requestAnimationFrame(animateSweep);
});


// Spotify Currently Playing Integration
const spotifyWidget = document.getElementById("spotifyWidget");
const spotifyTrack = document.getElementById("spotifyTrack");
const spotifyLink = document.getElementById("spotifyLink");

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
    // Garante que o progresso não ultrapasse a duração total
    const safeProgress = Math.min(localProgressMs, localDurationMs);
    spotifyTime.textContent = `${formatSpotifyTime(safeProgress)} / ${formatSpotifyTime(localDurationMs)}`;
    
    // Atualiza a barra de progresso visualmente
    if (spotifyProgressBar) {
      const percentage = (safeProgress / localDurationMs) * 100;
      spotifyProgressBar.style.width = `${percentage}%`;
    }
  }
}
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
        
        // Sincroniza o relógio local com os dados reais da API
        if (data.progress_ms && data.duration_ms) {
          localProgressMs = data.progress_ms;
          localDurationMs = data.duration_ms;
          isPlayingLocal = true;
          updateLocalTimeUI();
          
          // Se o contador local não estiver rodando, inicia ele
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
        
        // Só atualiza o texto e recria a animação se a música MUDOU
        if (spotifyTrack.textContent !== text) {
          spotifyTrack.textContent = text;
          
          // Checa se o texto precisa de scroll
          setTimeout(() => {
            const info = spotifyTrack.parentElement;
            
            // Limpa animações anteriores
            if (spotifyTrack.scrollAnim) {
              spotifyTrack.scrollAnim.cancel();
            }
            
            // Verifica se precisa de scroll (independentemente se é mobile ou desktop)
            if (spotifyTrack.scrollWidth > info.clientWidth) {
              const dist = spotifyTrack.scrollWidth - info.clientWidth;
              // 40ms por pixel, mínimo 3s, máximo 15s pra não ficar lento demais
              const duration = Math.min(Math.max(3000, dist * 40), 15000); 
              
              spotifyTrack.scrollAnim = spotifyTrack.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(0)', offset: 0.10 }, // Pausa menor no início
                { transform: `translateX(-${dist}px)`, offset: 0.90 },
                { transform: `translateX(-${dist}px)` } // Pausa no final
              ], {
                duration: duration,
                iterations: Infinity,
                direction: 'alternate',
                easing: 'ease-in-out'
              });
            }
          }, 100);
        }
        
        spotifyLink.href = data.songUrl;
        spotifyLink.style.pointerEvents = "auto";
      } else {
        spotifyLabel.textContent = "coto tá ouvindo";
        if (spotifyTime) spotifyTime.textContent = "";
        if (progressWrapper) progressWrapper.style.display = "none";
        
        // Para o relógio local se a música pausou
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
      }
      spotifyWidget.classList.add("active");
    } else {
      spotifyWidget.classList.remove("active");
    }
  } catch (error) {
    console.error("Erro ao buscar dados do Spotify:", error);
  }
}

// Verifica a música ao carregar e atualiza na API a cada 5 segundos
fetchSpotifyCurrentlyPlaying();
setInterval(fetchSpotifyCurrentlyPlaying, 2000);
