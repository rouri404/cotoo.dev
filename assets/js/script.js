const canvas = document.getElementById('pixel-trail');
const ctx = canvas.getContext('2d');
const FADE_DURATION = 500;

let pixelSize = 24;
const activePixels = new Map();
let animId = null;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    pixelSize = window.innerWidth < 768 ? 16 : 24;
}

function draw(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';

    for (const [key, startTime] of activePixels) {
        const elapsed = now - startTime;
        if (elapsed >= FADE_DURATION) {
            activePixels.delete(key);
        } else {
            const opacity = 1 - (elapsed / FADE_DURATION);
            const [col, row] = key.split(',').map(Number);
            ctx.globalAlpha = opacity;
            ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
        }
    }

    if (activePixels.size > 0) {
        animId = requestAnimationFrame(draw);
    } else {
        animId = null;
    }
}

function handlePointerMove(e) {
    const col = Math.floor(e.clientX / pixelSize);
    const row = Math.floor(e.clientY / pixelSize);
    const key = `${col},${row}`;

    activePixels.set(key, performance.now());

    if (!animId) {
        animId = requestAnimationFrame(draw);
    }
}

window.addEventListener('resize', resize);
window.addEventListener('pointermove', handlePointerMove);
resize();
