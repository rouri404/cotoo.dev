// Dev-only smoke and performance checks for cotoo.dev, run in headless Chromium with playwright-core.
// playwright-core is not a project dependency; install it without touching package.json:
//
//   npm i --no-save playwright-core && npx playwright-core install chromium
//
//   node scripts/check.js                          # starts `vercel dev --listen 3111 --yes`, stops it at the end
//   node scripts/check.js --url http://localhost:3111   # uses a server that is already running
//   node scripts/check.js --port 3200              # another port for the server it starts
//
// Desktop (1280x800) and iPhone 14 (touch): fps and long tasks on the hero, the menu, the theme toggle and the blog;
// Tux dragged with mouse and touch without opening the terminal; Tux not draggable on the blog; a click on him opens
// the terminal; no requests to Google Fonts; no uncaught page errors (the Cloudflare Turnstile 600010 error is local
// noise and ignored). Exits with 1 when a check fails.
const { spawn } = require("node:child_process");

let chromium, devices;
try {
  ({ chromium, devices } = require("playwright-core"));
} catch (_) {
  console.error("playwright-core is missing: npm i --no-save playwright-core && npx playwright-core install chromium");
  process.exit(2);
}

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const PORT = Number(arg("--port")) || 3111;
let BASE = arg("--url") || "";

const MIN_FPS = 50;
const MAX_LONG_TASK_MS = 100;
// Local noise: Turnstile refuses localhost (600010)
const IGNORED_ERRORS = [/Turnstile.*600010/];

const results = [];
function check(device, name, ok, detail = "") {
  results.push({ device, name, ok, detail });
  console.log(`${ok ? "ok  " : "FAIL"}  ${device.padEnd(9)} ${name}${detail ? "  (" + detail + ")" : ""}`);
}

async function startServer() {
  const child = spawn("vercel", ["dev", "--listen", String(PORT), "--yes"], { detached: true, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  const url = `http://localhost:${PORT}`;
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("vercel dev exited:\n" + log);
    try {
      const res = await fetch(url + "/blog/");
      if (res.ok) return { child, url };
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("vercel dev did not answer in 2 min:\n" + log);
}

function stopServer(child) {
  // The whole process group, so the dev server's own workers go too
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch (_) {}
}

// Frame rate and long tasks over a window of time, measured inside the page
function measure(page, ms) {
  return page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        const longs = [];
        try {
          new PerformanceObserver((list) => list.getEntries().forEach((e) => longs.push(Math.round(e.duration)))).observe({ entryTypes: ["longtask"] });
        } catch (_) {}
        const frames = [];
        let last = performance.now();
        const t0 = last;
        (function tick(now) {
          frames.push(now - last);
          last = now;
          if (now - t0 < ms) return requestAnimationFrame(tick);
          frames.shift();
          resolve({ fps: +(1000 / (frames.reduce((a, b) => a + b, 0) / frames.length)).toFixed(1), longTasks: longs });
        })(last);
      }),
    ms
  );
}

function perfCheck(device, name, r) {
  const worst = Math.max(0, ...r.longTasks);
  check(device, `${name}: ${r.fps} fps, ${r.longTasks.length} long tasks`, r.fps >= MIN_FPS && worst < MAX_LONG_TASK_MS, worst ? "longest " + worst + " ms" : "");
}

async function dragTux(page, ctx, touch) {
  const box = await page.locator(".mascot-hit").boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  if (touch) {
    const cdp = await ctx.newCDPSession(page);
    const point = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await point("touchStart", cx, cy);
    for (let i = 1; i <= 10; i++) {
      await point("touchMove", cx - 10 * i, cy - 15 * i);
      await page.waitForTimeout(16);
    }
    await point("touchEnd");
  } else {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(cx - 20 * i, cy - 15 * i);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
  }
  await page.waitForTimeout(800);
  const after = await page.locator(".mascot-hit").boundingBox();
  return Math.hypot(after.x - box.x, after.y - box.y);
}

async function runDevice(browser, device, options) {
  const ctx = await browser.newContext(options);
  // No greeting: its bubble would only add noise to the measurements
  await ctx.addInitScript(() => sessionStorage.setItem("mascot-greeted", "1"));
  const page = await ctx.newPage();
  const errors = [];
  const googleFonts = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => /fonts\.(googleapis|gstatic)\.com/.test(r.url()) && googleFonts.push(r.url()));
  const touch = !!options.hasTouch;

  await page.goto(BASE + "/", { waitUntil: "load" });
  const shown = await page.waitForSelector(".mascot-box:not([hidden])", { timeout: 15000 }).then(() => true, () => false);
  check(device, "Tux shows up on the home page", shown);
  await page.waitForTimeout(1500);
  perfCheck(device, "hero", await measure(page, 3000));

  if (shown) {
    const moved = await dragTux(page, ctx, touch);
    const state = await page.evaluate(() => ({
      term: !!document.querySelector(".term.is-open"),
      stage: document.body.dataset.stage,
      perch: !!sessionStorage.getItem("mascot-perch"),
    }));
    check(device, `drag with ${touch ? "touch" : "mouse"} moves Tux`, moved > 50 && state.perch, Math.round(moved) + " px");
    check(device, "drag does not open the terminal or leave the hero", !state.term && state.stage === "hero");

    await page.evaluate(() => window.dispatchEvent(new CustomEvent("mascot:reset", { detail: {} })));
    await page.waitForTimeout(800);
    const box = await page.locator(".mascot-hit").boundingBox();
    if (touch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(900);
    check(device, "a click on Tux opens the terminal", await page.evaluate(() => !!document.querySelector(".term.is-open")));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  await page.evaluate(() => document.body.click());
  await page.waitForTimeout(2500);
  check(device, "the page moves on to the menu", (await page.evaluate(() => document.body.dataset.stage)) === "menu");
  perfCheck(device, "menu", await measure(page, 2000));

  const before = await page.evaluate(() => document.documentElement.getAttribute("data-theme") || "light");
  await page.evaluate(() => document.getElementById("themeToggle").click());
  perfCheck(device, "theme toggle", await measure(page, 1500));
  const after = await page.evaluate(() => ({ theme: document.documentElement.getAttribute("data-theme"), busy: document.body.classList.contains("is-transitioning") }));
  check(device, `theme toggle switches ${before} -> ${after.theme}`, after.theme !== before && !after.busy);

  for (const path of ["/blog/", "/blog/docker-containers/"]) {
    const res = await page.goto(BASE + path, { waitUntil: "load" });
    check(device, `${path} answers 200`, res && res.status() === 200, res ? String(res.status()) : "no response");
    await page.waitForTimeout(2000);
    perfCheck(device, path, await measure(page, 2000));
    const draggable = await page.evaluate(() => {
      const box = document.querySelector(".mascot-box");
      return box ? box.classList.contains("is-draggable") : null;
    });
    check(device, `Tux is not draggable on ${path}`, draggable === false, draggable === null ? "no mascot" : "");
  }

  for (const path of ["/blog/tag/", "/now/", "/uses/", "/manifest.webmanifest"]) {
    const res = await page.request.get(BASE + path);
    check(device, `${path} answers 200`, res.status() === 200, String(res.status()));
  }

  check(device, "no requests to Google Fonts", googleFonts.length === 0, googleFonts.slice(0, 2).join(", "));
  const real = errors.filter((m) => !IGNORED_ERRORS.some((re) => re.test(m)));
  check(device, "no uncaught page errors", real.length === 0, real.slice(0, 3).join(" | "));
  await ctx.close();
}

(async () => {
  let server = null;
  try {
    if (!BASE) {
      console.log(`starting vercel dev on port ${PORT}...`);
      server = await startServer();
      BASE = server.url;
    }
    const browser = await chromium.launch();
    try {
      await runDevice(browser, "desktop", { viewport: { width: 1280, height: 800 } });
      await runDevice(browser, "iPhone 14", { ...devices["iPhone 14"] });
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error(err.message || err);
    results.push({ ok: false });
  } finally {
    if (server) stopServer(server.child);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : `\nall ${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})();
