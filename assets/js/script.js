const canvas = document.getElementById('pixel-trail');
const ctx = canvas.getContext('2d');
const FADE_DURATION = 500;

let pixelSize = 24;
const activePixels = new Map();

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    pixelSize = window.innerWidth < 768 ? 16 : 24;
}




/* ---------- render loop ---------- */
function draw(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    for (const [key, startTime] of activePixels) {
        const elapsed = now - startTime;
        if (elapsed >= FADE_DURATION) {
            activePixels.delete(key);
        } else {
            const opacity = 1 - elapsed / FADE_DURATION;
            const [col, row] = key.split(',').map(Number);
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

/* ---------- stage navigation ---------- */
const heroStage = document.getElementById('stage-hero');
const menuStage = document.getElementById('stage-menu');

function goToMenu() {
    if (document.body.dataset.stage === 'menu') return;
    document.body.dataset.stage = 'menu';
    heroStage.classList.remove('active');
    menuStage.classList.add('active');
}

function goToHero() {
    if (document.body.dataset.stage === 'hero') return;
    document.body.dataset.stage = 'hero';
    menuStage.classList.remove('active');
    heroStage.classList.add('active');
}

window.addEventListener('resize', resize);
window.addEventListener('pointermove', handlePointerMove);

// Click anywhere on hero stage to advance
window.addEventListener('click', (e) => {
    if (document.body.dataset.stage === 'hero') goToMenu();
});

// Scroll to navigate
window.addEventListener('wheel', (e) => {
    if (e.deltaY > 20) goToMenu();
    else if (e.deltaY < -20) goToHero();
}, { passive: true });

window.addEventListener('keydown', (e) => {
    if (['Enter', ' ', 'ArrowDown', 'PageDown'].includes(e.key)) goToMenu();
    if (['Escape', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) goToHero();
});

/* ---------- project list ---------- */
document.querySelectorAll('.projects li').forEach((li) => {
    li.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = li.getAttribute('data-url');
        if (url) window.open(url, '_blank', 'noopener');
    });
    li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') li.click();
    });
});

resize();
document.body.dataset.stage = 'hero';
requestAnimationFrame(draw);

/* ---------- scramble effect ---------- */
class ScrambleText {
    constructor(el) {
        this.el = el;
        // Standard retro characters
        this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+-=?';
        // USE textContent, NOT innerText! innerText returns "" if the element is visibility: hidden!
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
            let visiblePart = '';
            let hiddenPart = '';

            for (let i = 0; i < this.originalText.length; i++) {
                if (i < Math.floor(iteration)) {
                    // Character is fully revealed
                    visiblePart += this.originalText[i];
                } else if (i < Math.floor(iteration) + 2) { 
                    // The "scrambling tip" (1 or 2 random characters at the edge)
                    visiblePart += this.originalText[i] === ' ' ? ' ' : this.chars[Math.floor(Math.random() * this.chars.length)];
                } else {
                    // The rest of the string remains invisible but preserves exact layout width!
                    hiddenPart += this.originalText[i];
                }
            }
            
            // Use opacity: 0 to hide the remaining text without collapsing the element's width/height
            this.el.innerHTML = visiblePart + `<span style="opacity: 0">${hiddenPart}</span>`;
            
            iteration += 1 / 2; // Speed: reveals 1 character every 2 frames (60ms)

            if (iteration >= this.originalText.length) {
                clearInterval(this.interval);
                this.el.textContent = this.originalText;
                this.isScrambling = false;
            }
        }, 30);
    }
}

// Scramble hero on load
setTimeout(() => {
    document.querySelectorAll('#stage-hero h2, #stage-hero p').forEach(el => {
        new ScrambleText(el).start();
    });
}, 200);

// Scramble projects on hover (REMOVED)
// Instead, prepare 3D letter swap effect on load
document.querySelectorAll('.projects .name').forEach(el => {
    const text = el.textContent.trim();
    el.innerHTML = ''; // clear

    text.split('').forEach((char, i) => {
        const wrapper = document.createElement('span');
        wrapper.className = 'letter-3d-wrapper';
        wrapper.style.transitionDelay = `${i * 0.03}s`; // Stagger effect

        const front = document.createElement('span');
        front.className = 'letter-3d-front';
        front.textContent = char === ' ' ? '\u00A0' : char; // Preserve spaces

        const bottom = document.createElement('span');
        bottom.className = 'letter-3d-bottom';
        bottom.textContent = char === ' ' ? '\u00A0' : char;

        wrapper.appendChild(front);
        wrapper.appendChild(bottom);
        el.appendChild(wrapper);
    });
});
