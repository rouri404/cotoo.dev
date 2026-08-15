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
  if (e.pointerType === "touch") return;
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

let secretKeystrokes = "";

window.addEventListener("keydown", (e) => {
  // Track "coto" konami code
  if (e.key.length === 1) {
    secretKeystrokes += e.key.toLowerCase();
    if (secretKeystrokes.length > 4) secretKeystrokes = secretKeystrokes.slice(-4);
    if (secretKeystrokes === "coto") {
      firePixelConfetti();
      setTimeout(() => {
        const secretModal = document.getElementById("secretModal");
        if (secretModal) secretModal.classList.add("active");
      }, 800); // delay modal slightly to enjoy confetti
      secretKeystrokes = "";
    }
  }

  if (e.key === "Escape") {
    const activeModals = document.querySelectorAll(".modal-overlay.active");
    if (activeModals.length > 0) {
      activeModals.forEach((modal) => modal.classList.remove("active"));
      if (document.activeElement) document.activeElement.blur();
      return; // aborta para não voltar à tela inicial
    }
  }
  if (["Enter", " ", "ArrowDown", "PageDown"].includes(e.key)) goToMenu();
  if (["Escape", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) goToHero();
});

document.querySelectorAll(".projects li").forEach((li) => {
  li.addEventListener("click", (e) => {
    e.stopPropagation();
    const url = li.getAttribute("data-url");
    const modalId = li.getAttribute("data-modal");
    
    // Força o efeito hover (o flip 3D) a aparecer e ficar "travado"
    li.classList.add("is-clicked");
    
    if (modalId) {
      // Abre o modal instantaneamente (sem lag)
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.add("active");
      setTimeout(() => li.classList.remove("is-clicked"), 100);
    } else if (url) {
      // Para links externos, espera 400ms pro usuário ver a animação de flip 3D antes de mudar de aba
      setTimeout(() => {
        window.open(url, "_blank", "noopener");
        setTimeout(() => li.classList.remove("is-clicked"), 100);
      }, 400);
    }
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
  let globalIndex = 0;
  
  // Agrupa os caracteres em palavras para evitar quebra no meio da palavra no mobile
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
    
    // Adiciona o espaço entre as palavras, exceto na última
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
  const metaTheme = document.getElementById("meta-theme-color");
  if (metaTheme) metaTheme.setAttribute("content", newBgColor);
  
  transCanvas.width = window.innerWidth;
  transCanvas.height = window.innerHeight;
  transCanvas.classList.add("active");
  document.body.classList.add("is-transitioning");
  
  const elementsToFlip = document.querySelectorAll(
    '.theme-toggle, h2, .letter-3d-wrapper, p, li, .sq, .name, .desc, .socials a img, .spotify-widget, .github-status'
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
  
  const duration = 800; // ms for the entire sweep (mais rápido!)
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
      document.body.classList.remove("is-transitioning");
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

// Verifica a música ao carregar e atualiza na API a cada 5 segundos
fetchSpotifyCurrentlyPlaying();
setInterval(fetchSpotifyCurrentlyPlaying, 2000);

// Custom Notification System
let notificationTimeout;
function showNotification(msg) {
  const notifEl = document.getElementById("customNotification");
  if (!notifEl) return;
  notifEl.innerHTML = ""; // limpa tudo
  notifEl.className = "custom-notification show"; // reseta
  
  // Cria os blocos caindo
  const numBlocks = 5;
  for (let i = 0; i < numBlocks; i++) {
    const block = document.createElement("div");
    block.className = "tetris-chunk";
    // Define a posição horizontal e o delay do bloco
    block.style.left = `${(i / numBlocks) * 100}%`;
    block.style.width = `${100 / numBlocks}%`;
    // Padrão de queda: bordas primeiro, centro por último
    // Para 5 blocos (0, 1, 2, 3, 4), o centro é 2.
    // Delay: 0s para as pontas, 0.1s para os meios, 0.2s pro centro.
    const distFromCenter = Math.abs(i - 2);
    const delay = (2 - distFromCenter) * 0.1;
    block.style.setProperty('--delay-in', `${delay}s`);
    block.style.setProperty('--delay-out', `${0.2 - delay}s`);
    notifEl.appendChild(block);
  }
  
  // Cria o texto
  const textEl = document.createElement("div");
  textEl.className = "tetris-msg";
  textEl.textContent = msg.toLowerCase();
  notifEl.appendChild(textEl);
  
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notifEl.classList.remove("show");
    notifEl.classList.add("hide");
    setTimeout(() => {
      notifEl.innerHTML = "";
      notifEl.classList.remove("hide");
    }, 500); // tempo suficiente para as animações de saída terminarem
  }, 4000);
}

// Visitor Listen Along Auth and Sync
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
      // Busca a redirect URI que o backend estiver configurado para usar
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
        
        // Clean URL
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
      // Tem token válido, tenta sincronizar
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
      // Sem token ou token expirado, inicia auth
      try {
        listenAlongBtn.textContent = "conectando...";
        const res = await fetch("/api/spotify-client-id");
        const data = await res.json();
        const clientId = data.clientId;
        
        // Pega do backend ou fallback pra prod
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

// Github Live Status
async function fetchGithubActivity() {
  const el = document.getElementById("githubStatus");
  if (!el) return;
  
  try {
    const res = await fetch("https://api.github.com/users/rouri404/events/public");
    if (!res.ok) throw new Error("API rate limit");
    
    const events = await res.json();
    const pushEvent = events.find(e => e.type === "PushEvent");
    
    if (pushEvent) {
      const date = new Date(pushEvent.created_at);
      const diff = Math.floor((new Date() - date) / 60000); // minutos
      
      if (diff === 0) {
        el.textContent = `último commit: agora mesmo`;
      } else {
        let timeStr = "";
        if (diff < 60) timeStr = `${diff}m`;
        else if (diff < 1440) timeStr = `${Math.floor(diff / 60)}h`;
        else timeStr = `${Math.floor(diff / 1440)}d`;
        
        el.textContent = `último commit: ${timeStr} atrás`;
      }
    } else {
      el.style.display = "none";
    }
  } catch (err) {
    el.style.display = "none";
  }
}
fetchGithubActivity();

// Pixel Confetti Effect
function firePixelConfetti() {
  const colors = ["#8FBC8B", "#ffffff", "#444444"];
  const isMobile = window.innerWidth < 600;
  const count = isMobile ? 80 : 150;
  
  // Super Glitch / Flashbang Effect
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
    // Retro box shadow to give it depth
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
      currentVy += 0.8; // gravidade pesada retro
      rotation += rotSpeed;
      
      // Bouncing off the bottom of the screen
      const bottomLimit = window.innerHeight / 2 - 20;
      if (y > bottomLimit) {
        y = bottomLimit;
        currentVy = -currentVy * 0.5; // quica perdendo força
        vx *= 0.8; // atrito no chão
        bounces++;
      }
      
      confetti.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      
      // Remove after bouncing around and falling or losing momentum
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
